import { log, BigInt } from '@graphprotocol/graph-ts'
import {
  DelegationController,
  DelegationAccepted,
  DelegationRequestCanceledByUser,
  UndelegationRequested,
  DelegationProposed
 } from '../../generated/DelegationController/DelegationController'
import { Delegation, DelegationMeta, Delegator, Validator } from '../../generated/schema'
import { getOrCreateBlock, ZERO, ONE } from './common'

const DELEGATION_META_ID = 'delegation_meta'

let DELEGATION_STATE = new Map<number, string>()
DELEGATION_STATE.set(0, 'PROPOSED')
DELEGATION_STATE.set(1, 'CANCELED')
DELEGATION_STATE.set(2, 'DELEGATED')
DELEGATION_STATE.set(3, 'UNDELEGATED')

function getOrCreateDelegationMeta(): DelegationMeta {
  let meta = DelegationMeta.load(DELEGATION_META_ID)
  if (meta == null) {
    meta = new DelegationMeta(DELEGATION_META_ID)
    meta.currentCount = ZERO
    meta.currentAmount = ZERO

    meta.save()
  }

  return meta as DelegationMeta
}

function getOrCreateDelegator(address: string): Delegator {
  let delegator = Delegator.load(address)

  if (delegator == null) {
    delegator = new Delegator(address)
    delegator.currentCount = ZERO
    delegator.currentAmount = ZERO

    delegator.save()
  }

  return delegator as Delegator
}

export function handleDelegationAccepted(event: DelegationAccepted): void {
  let contract = DelegationController.bind(event.address)
  let delegationValues = contract.delegations(event.params.delegationId)
  let amount = delegationValues.value2

  let meta = getOrCreateDelegationMeta()
  meta.currentCount = meta.currentCount.plus(ONE)
  meta.currentAmount = meta.currentAmount.plus(amount)

  meta.save()

  let delegator = Delegator.load(delegationValues.value0.toHex())
  delegator.currentCount = delegator.currentCount.plus(ONE)
  delegator.currentAmount = delegator.currentAmount.plus(amount)

  delegator.save()

  let delegation = Delegation.load(event.params.delegationId.toString())
  delegation.state = DELEGATION_STATE.get(2)
  delegation.started = delegationValues.value5

  delegation.save()

  let validator = Validator.load(delegation.validator)
  validator.currentDelegationCount = validator.currentDelegationCount.plus(ONE)
  validator.currentDelegationAmount = validator.currentDelegationAmount.plus(amount)

  validator.save()
}

export function handleDelegationRequestCanceledByUser(event: DelegationRequestCanceledByUser): void {
  let contract = DelegationController.bind(event.address)
  let delegationValues = contract.delegations(event.params.delegationId)
  let delegation = Delegation.load(event.params.delegationId.toString())

  delegation.state = DELEGATION_STATE.get(1)
  delegation.finished = delegationValues.value6

  delegation.save()
}

export function handleUndelegationRequested(event: UndelegationRequested): void {
  let contract = DelegationController.bind(event.address)
  let delegationValues = contract.delegations(event.params.delegationId)
  let amount = delegationValues.value2

  let meta = getOrCreateDelegationMeta()
  meta.currentCount = meta.currentCount.minus(ONE)
  meta.currentAmount = meta.currentAmount.minus(amount)

  let delegator = Delegator.load(delegationValues.value0.toHex())
  delegator.currentCount = delegator.currentCount.minus(ONE)
  delegator.currentAmount = delegator.currentAmount.minus(amount)

  delegator.save()

  let delegation = Delegation.load(event.params.delegationId.toString())
  delegation.state = DELEGATION_STATE.get(3)
  delegation.finished = delegationValues.value6

  delegation.save()

  let validator = Validator.load(delegation.validator)
  validator.currentDelegationCount = validator.currentDelegationCount.minus(ONE)
  validator.currentDelegationAmount = validator.currentDelegationAmount.minus(amount)

  validator.save()
}

export function handleDelegationProposed(event: DelegationProposed): void {
  let block = getOrCreateBlock(event.block)
  let contract = DelegationController.bind(event.address)
  let delegationValues = contract.delegations(event.params.delegationId)
  let delegator = getOrCreateDelegator(delegationValues.value0.toHex())
  let validator = Validator.load(delegationValues.value1.toString())

  let delegation = new Delegation(event.params.delegationId.toString())

  delegation.state = DELEGATION_STATE.get(0)
  delegation.holder = delegator.id
  delegation.validator = validator.id
  delegation.amount = delegationValues.value2
  delegation.delegationPeriod = delegationValues.value3
  delegation.info = delegationValues.value7
  delegation.created = delegationValues.value4
  delegation.started = delegationValues.value5
  delegation.finished = delegationValues.value6
  delegation.delegatedBlock = block

  delegation.save()
}
