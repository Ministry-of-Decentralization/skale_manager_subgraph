import {
  DelegationController,
  DelegationAccepted,
  DelegationRequestCanceledByUser,
  UndelegationRequested,
  DelegationProposed
 } from '../../generated/DelegationController/DelegationController'
import { BigInt } from '@graphprotocol/graph-ts'
import { Delegation, DelegationMeta, Delegator, Validator } from '../../generated/schema'
import { getOrCreateBlock } from './common'

let DELEGATION_STATE = new Map<number, string>()

DELEGATION_STATE.set(0, 'PROPOSED')
DELEGATION_STATE.set(1, 'CANCELED')
DELEGATION_STATE.set(2, 'DELEGATED')
DELEGATION_STATE.set(3, 'UNDELEGATTED')

function getOrCreateDelegationMeta(): DelegationMeta {
  let meta = DelegationMeta.load('meta')
  if (meta == null) {
    meta = new DelegationMeta('meta')
    meta.count = new BigInt(0)
    meta.delegatorCount = new BigInt(0)
    meta.save()
  }
  return meta as DelegationMeta
}

function getOrCreateDelegator(address: string): Delegator {
  let delegator = Delegator.load(address)

  if (delegator == null) {
    delegator = new Delegator(address)
    let meta = getOrCreateDelegationMeta()
    meta.delegatorCount = meta.delegatorCount.plus(BigInt.fromI32(1))
    meta.save()
    delegator.save()
  }
  return delegator as Delegator
}

export function handleDelegationAccepted(event: DelegationAccepted): void {
  let meta = getOrCreateDelegationMeta()
  meta.count = meta.count.plus(BigInt.fromI32(1))
  meta.save()

  let delegation = Delegation.load(event.params.delegationId.toString())
  delegation.state = DELEGATION_STATE.get(2)
  delegation.save()
}

export function handleDelegationRequestCanceledByUser(event: DelegationRequestCanceledByUser): void {
  let delegation = Delegation.load(event.params.delegationId.toString())
  delegation.state = DELEGATION_STATE.get(1)
  delegation.save()
}

export function handleUndelegationRequested(event: UndelegationRequested): void {
  let delegation = Delegation.load(event.params.delegationId.toString())
  delegation.state = DELEGATION_STATE.get(3)
  delegation.save()
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
