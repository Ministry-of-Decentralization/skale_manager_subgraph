import { BigInt } from '@graphprotocol/graph-ts'
import { NodeCreated, ExitInitialized, ExitCompleted } from '../../generated/Nodes/Nodes'
import { Node, NodeAddress } from '../../generated/schema'
import { getOrCreateBlock } from './common'

let NODE_STATUS = new Map<number, string>()

NODE_STATUS.set(0, 'Active')
NODE_STATUS.set(1, 'Leaving')
NODE_STATUS.set(2, 'Left')
NODE_STATUS.set(3, 'In_Maintenance')

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

export function handleExitInitialized(event: ExitInitialized): void {
  let node = new Node(event.params.nodeIndex.toString())
  node.status = NODE_STATUS.get(1)
  node.save()
}

export function handleExitCompleted(event: ExitCompleted): void {
  let node = new Node(event.params.nodeIndex.toString())
  node.status = NODE_STATUS.get(2)
  node.save()
}