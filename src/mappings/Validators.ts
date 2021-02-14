import {
  ValidatorWasEnabled,
  ValidatorWasDisabled,
  ValidatorAddressChanged,
  NodeAddressWasAdded,
  NodeAddressWasRemoved,
  RegisterValidatorCall
 } from '../../generated/ValidatorService/ValidatorService'
import { Validator, ValidatorMeta, NodeAddress } from '../../generated/schema'
import { Bytes, BigInt, store } from '@graphprotocol/graph-ts'
import { getOrCreateBlock } from './common'

function getOrCreateValidatorMeta(): ValidatorMeta {
  let meta = ValidatorMeta.load('meta')
  if (meta == null) {
    meta = new ValidatorMeta('meta')
    meta.count = new BigInt(0)
    meta.save()
  }
  return meta as ValidatorMeta
}

export function handleValidatorWasEnabled(event: ValidatorWasEnabled): void {
    let validator = Validator.load(event.params.validatorId.toString())
    validator.isEnabled = true
    validator.save()
}

export function handleValidatorWasDisabled(event: ValidatorWasDisabled): void {
  let validator = Validator.load(event.params.validatorId.toString())
  validator.isEnabled = false
  validator.save()
}
 
export function handleValidatorAddressChanged(event: ValidatorAddressChanged): void {
  let validator = Validator.load(event.params.validatorId.toString())
  validator.address = event.params.newAddress
  validator.save()
}

export function handleNodeAddressWasAdded(event: NodeAddressWasAdded): void {
  let address = event.params.nodeAddress.toHex()
  let nodeAddress = NodeAddress.load(address)

  if (nodeAddress == null) {
    nodeAddress = new NodeAddress(address)
    nodeAddress.save()
  }

  nodeAddress.validator = event.params.validatorId.toString()
  nodeAddress.save()
}

export function handleNodeAddressWasRemoved(event: NodeAddressWasRemoved): void {
  store.remove("NodeAddress", event.params.nodeAddress.toHex())
}

export function handleRegisterValidator(call: RegisterValidatorCall): void {
  let meta = getOrCreateValidatorMeta()
  meta.count = meta.count.plus(BigInt.fromI32(1))
  meta.save()

  let block = getOrCreateBlock(call.block)
  let validator = new Validator(meta.count.toString())

  validator.name = call.inputValues[0].value.toString()
  validator.description = call.inputValues[1].value.toString()
  validator.feeRate = call.inputValues[2].value.toBigInt()
  validator.minimumDelegationAmount = call.inputValues[3].value.toBigInt()
  validator.address = call.transaction.from
  validator.requestedAddress = new Bytes(0x0)
  validator.registrationTime = call.block.timestamp
  validator.acceptNewRequests = true
  validator.isEnabled = false
  validator.registeredBlock = block

  validator.save()
}