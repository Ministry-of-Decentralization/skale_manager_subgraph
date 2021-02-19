import { store } from '@graphprotocol/graph-ts'
import { SchainCreated, SchainDeleted, NodeRotated, NodeAdded, SchainNodes } from '../../generated/Schains/Schains'
import { Schain, SchainNode, SchainOwner, SchainMeta } from '../../generated/schema'
import { getOrCreateBlock, ZERO, ONE } from './common'

const SCHAINS_META_ID = 'schains_meta'

function getOrCreateSchainMeta(): SchainMeta {
  let meta = SchainMeta.load(SCHAINS_META_ID)
  if (meta == null) {
    meta = new SchainMeta(SCHAINS_META_ID)
    meta.currentCount = ZERO

    meta.save()
  }

  return meta as SchainMeta
}

function getOrCreateSchainOwner(address: string): SchainOwner {
  let owner = SchainOwner.load(address)

  if (owner == null) {
    owner = new SchainOwner(address)
    owner.currentCount = ZERO

    owner.save()
  }

  return owner as SchainOwner
}

function createSchainNode(schainId: string, nodeId: string): SchainNode {
  let id = schainId + nodeId
  let schainNode = new SchainNode(id)
  schainNode.schain = schainId
  schainNode.node = nodeId

  schainNode.save()

  return schainNode
}

// Handle the SchainNodes event, the first event emitted
// during the creation of an Schain
export function handleSchainNodes(event: SchainNodes): void {
  let schainId = event.params.schainId.toString()
  let schain = new Schain(schainId)
  let nodes = event.params.nodesInGroup

  for (let i: i32 = 0, l: i32 = nodes.length; i < l; ++i) {
    let toAdd = nodes[i]
    createSchainNode(schainId, toAdd.toString())
  }

  schain.save()
}

export function handleSchainCreated(event: SchainCreated): void {
  let schain = Schain.load(event.params.schainId.toString())
  let block = getOrCreateBlock(event.block)
  let owner =  getOrCreateSchainOwner(event.params.owner.toHex())
  let meta = getOrCreateSchainMeta()

  meta.currentCount = meta.currentCount.plus(ONE)
  meta.save()

  owner.currentCount = owner.currentCount.plus(ONE)
  owner.save()
  
  schain.name = event.params.name
  schain.owner = owner.id
  schain.partOfNode = event.params.partOfNode
  schain.lifetime = event.params.lifetime
  schain.deposit = event.params.deposit
  schain.nonce = event.params.nonce
  schain.createdBlock = block
  schain.save()
}

export function handleSchainDeleted(event: SchainDeleted): void {
  let schainId = event.params.schainId.toString()
  let schain = Schain.load(schainId)

  let schainNodes = schain.nodes
  // remove all the 
  for (let i = 0; i< schainNodes.length; i++) {
    let schainNodeId = schainId + schainNodes[i]
    store.remove("SchainNode", schainNodeId)
  }

  // update the Schain Owner
  let owner = SchainOwner.load(schain.owner)
  owner.currentCount = owner.currentCount.minus(ONE)

  // update the meta
  let meta = SchainMeta.load(SCHAINS_META_ID)
  meta.currentCount = meta.currentCount.minus(ONE)

  // remove the Schain entity
  store.remove("Schain", schainId)
}

export function handleNodeAdded(event: NodeAdded): void { 
  createSchainNode(event.params.schainId.toString(), event.params.newNode.toString())
}

export function handleNodeRotated(event: NodeRotated): void {
  let oldNodeId = event.params.schainId.toString() + event.params.oldNode.toString()

  // remove the old SchainNode
  store.remove("SchainNode", oldNodeId)

  // create the new Schain Node
  createSchainNode(event.params.schainId.toString(), event.params.newNode.toString())
}
