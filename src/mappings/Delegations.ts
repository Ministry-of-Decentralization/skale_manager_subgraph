import {
  DelegationAccepted,
  DelegationRequestCanceledByUser,
  UndelegationRequested,
  DelegateCall
 } from '../../generated/ValidatorService/DelegationController'
import { BigInt } from '@graphprotocol/graph-ts'
import { Delegation, DelegationMeta, Delegator, Validator } from '../../generated/schema'
import { getOrCreateBlock } from './common'

let DELEGATION_STATE = new Map<number, string>()

DELEGATION_STATE.set(0, 'PROPOSED')
DELEGATION_STATE.set(1, 'ACCEPTED')
DELEGATION_STATE.set(2, 'CANCELED')
DELEGATION_STATE.set(3, 'REJECTED')
DELEGATION_STATE.set(4, 'DELEGATED')
DELEGATION_STATE.set(5, 'UNDELEGATION_REQUESTED')
DELEGATION_STATE.set(6, 'COMPLETED')

function getOrCreateDelegationMeta(): DelegationMeta {
  let meta = DelegationMeta.load('meta')
  if (meta == null) {
    meta = new DelegationMeta('meta')
    meta.count = new BigInt(0)
    meta.save()
  }
  return meta as DelegationMeta
}

function getOrCreateDelegator(address: string): Delegator {
  let delegator = Delegator.load(address)
  if (delegator == null) {
    delegator = new DelegationMeta(address)
    delegator.save()
  }
  return delegator
}

export function handleDelegationAccepted(event: DelegationAccepted): void {
  let delegation = Delegation.load(event.params.delegationId.toString())
  delegation.state = DELEGATION_STATE.get(1)
  delegation.save()
}

export function handleDelegationRequestCanceledByUser(event: DelegationRequestCanceledByUser): void {
  let delegation = Delegation.load(event.params.delegationId.toString())
  delegation.state = DELEGATION_STATE.get(2)
  delegation.save()
}

export function handleUndelegationRequested(event: UndelegationRequested): void {
  let delegation = Delegation.load(event.params.delegationId.toString())
  delegation.state = DELEGATION_STATE.get(1)
  delegation.save()
}

export function handleDelegate(call: DelegateCall): void {
  let meta = getOrCreateDelegationMeta()
  meta.count = meta.count.plus(BigInt.fromI32(1))
  meta.save()

  let block = getOrCreateBlock(call.block)
  let delegator = getOrCreateDelegator(call.transaction.from)
  let validator = Validator.load(call.inputValues[0].value.toString())
  let delegation = new Delegation(meta.count.toString())

  delegation.state = DELEGATION_STATE.get(0)
  delegation.holder = delegator
  delegation.validator = validator
  delegation.amount = call.inputValues[1].value.toString()
  delegation.delegationPeriod = call.inputValues[2].value.toString()
  delegation.info = call.inputValues[3].value
  delegation.created = call.block.timestamp
  delegation.started = 0
  delegation.finished = 0
  delegation.delegatedBlock = block

  delegation.save()
}