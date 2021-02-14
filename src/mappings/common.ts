import { ethereum } from '@graphprotocol/graph-ts'
import { BigInt } from '@graphprotocol/graph-ts'
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

export function timestampToMonth(timestamp: BigInt) public view virtual returns (uint) {
  uint year;
  uint month;
  (year, month, ) = BokkyPooBahsDateTimeLibrary.timestampToDate(timestamp);
  require(year >= _ZERO_YEAR, "Timestamp is too far in the past");
  month = month.sub(1).add(year.sub(_ZERO_YEAR).mul(12));
  require(month > 0, "Timestamp is too far in the past");
  return month;
}