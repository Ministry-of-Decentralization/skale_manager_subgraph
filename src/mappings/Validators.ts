import {
  ValidatorWasEnabled,
  ValidatorWasDisabled,
  ValidatorAddressChanged,
  NodeAddressWasAdded,
  NodeAddressWasRemoved,
  ValidatorRegistered,
  ValidatorService
 } from '../../generated/ValidatorService/ValidatorService'
import { Validator, ValidatorMeta, NodeAddress } from '../../generated/schema'
import { BigInt, store } from '@graphprotocol/graph-ts'
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

export function handleValidatorRegistered(event: ValidatorRegistered): void {
  let meta = getOrCreateValidatorMeta()
  meta.count = meta.count. plus(BigInt.fromI32(1))
  meta.save()

  let block = getOrCreateBlock(event.block)

  let validator = new Validator(event.params.validatorId.toString())

  let contract = ValidatorService.bind(event.address)

  let validatorValues = contract.validators(event.params.validatorId)

  validator.name = validatorValues.value0
  validator.description = validatorValues.value3
  validator.feeRate = validatorValues.value4
  validator.minimumDelegationAmount = validatorValues.value6
  validator.address = validatorValues.value1
  validator.requestedAddress = validatorValues.value2
  validator.registrationTime = validatorValues.value5
  validator.acceptNewRequests = validatorValues.value7
  validator.isEnabled = false
  validator.registeredBlock = block

  validator.save()
}