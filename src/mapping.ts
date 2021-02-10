import {
  ValidatorWasEnabled,
  ValidatorWasDisabled,
  ValidatorAddressChanged,
  NodeAddressWasAdded,
  NodeAddressWasRemoved,
  RegisterValidatorCall
 } from '../generated/ValidatorService/ValidatorService'
import { NodeCreated } from '../generated/Nodes/Nodes'
import { Validator, ValidatorMeta, Node, NodeAddress,  Block } from '../generated/schema'
import { ethereum, Bytes, BigInt, store } from '@graphprotocol/graph-ts'

let NODE_STATUS = new Map<number, string>()
NODE_STATUS.set(0, 'Active')
NODE_STATUS.set(1, 'Leaving')
NODE_STATUS.set(2, 'Left')
NODE_STATUS.set(3, 'In_Maintenance')

function getOrCreateBlock(_block: ethereum.Block): string {
  let hash = _block.hash.toHex()
  let block = Block.load(hash)
  if (block == null) {
    block = new Block(hash)
    block.hash = hash
    block.number = _block.number
    block.timestamp = _block.timestamp
    block.save()
  }

  return block.id
}

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

export function handleNodeCreated(event: NodeCreated): void {
  let node = new Node(event.params.nodeIndex.toString())
  let nodeAddress = NodeAddress.load(event.params.owner.toHex())
  let block = getOrCreateBlock(event.block)
  
  node.name = event.params.name
  node.ip = event.params.ip
  node.publicIP = event.params.publicIP
  node.port = BigInt.fromI32(event.params.port)
  node.address = nodeAddress.id
  node.startBlock = block
  node.lastRewardDate = new BigInt(0)
  node.status = NODE_STATUS.get(0)
  node.validator = nodeAddress.validator
  node.startBlock = block

  node.save()
}

export function handleRegisterValidator(call: RegisterValidatorCall): void {
  let meta = getOrCreateValidatorMeta()
  let tdwo = BigInt.fromI32(1)
  tdwo.plus(new BigInt(3))
  meta.count = meta.count. plus(BigInt.fromI32(1))
  let validator = new Validator(meta.count.toString())
  let block = getOrCreateBlock(call.block)

  meta.save()
  
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
