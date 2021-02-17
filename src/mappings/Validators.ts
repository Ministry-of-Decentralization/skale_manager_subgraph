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
import { store } from '@graphprotocol/graph-ts'
import { getOrCreateBlock, ZERO, ONE } from './common'

const VALIDATION_META_ID = 'validator_meta'

function getOrCreateValidatorMeta(): ValidatorMeta {
  let meta = ValidatorMeta.load(VALIDATION_META_ID)

  if (meta == null) {
    meta = new ValidatorMeta(VALIDATION_META_ID)
    meta.currentCount = ZERO

    meta.save()
  }

  return meta as ValidatorMeta
}

export function handleValidatorWasEnabled(event: ValidatorWasEnabled): void {
  let meta = getOrCreateValidatorMeta()
  meta.currentCount = meta.currentCount.plus(ONE)

  meta.save()

  let validator = Validator.load(event.params.validatorId.toString())
  validator.isEnabled = true

  validator.save()
}

export function handleValidatorWasDisabled(event: ValidatorWasDisabled): void {
  let meta = getOrCreateValidatorMeta()
  meta.currentCount = meta.currentCount.minus(ONE)

  meta.save()

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
  let contract = ValidatorService.bind(event.address)
  let validatorValues = contract.validators(event.params.validatorId)
  let block = getOrCreateBlock(event.block)
  let validator = new Validator(event.params.validatorId.toString())

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
  validator.currentDelegationCount = ZERO
  validator.currentDelegationAmount = ZERO

  validator.save()
}