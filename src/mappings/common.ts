import { ethereum, BigInt } from '@graphprotocol/graph-ts'
import { Block, Delegator } from '../../generated/schema'

export function getOrCreateBlock(_block: ethereum.Block): string {
  let hash = _block.hash.toHex()
  let block = Block.load(hash)

  if (block == null) {
    block = new Block(hash)
    block.number = _block.number
    block.timestamp = _block.timestamp

    block.save()
  }

  return block.id
}

export function getOrCreateDelegator(address: string): Delegator {
  let delegator = Delegator.load(address)

  if (delegator == null) {
    delegator = new Delegator(address)
    delegator.currentCount = ZERO
    delegator.currentAmount = ZERO
    delegator.claimedBounty = ZERO

    delegator.save()
  }

  return delegator as Delegator
}

export let ZERO = BigInt.fromI32(0)
export let ONE = BigInt.fromI32(1)
