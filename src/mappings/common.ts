import { ethereum } from '@graphprotocol/graph-ts'
import { Block } from '../../generated/schema'

export function getOrCreateBlock(_block: ethereum.Block): string {
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
