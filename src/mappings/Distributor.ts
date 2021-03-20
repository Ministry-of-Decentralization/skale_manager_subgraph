import {
  WithdrawBounty,
  WithdrawFee
 } from '../../generated/Distributor/Distributor'
import {  Validator } from '../../generated/schema'
import { getOrCreateDelegator } from './common'

export function handleWithdrawBounty(event: WithdrawBounty): void {
  let delegator = getOrCreateDelegator(event.params.holder.toHex())
 
  delegator.claimedBounty = delegator.claimedBounty.plus(event.params.amount)

  delegator.save()
}

export function handleWithdrawFee(event: WithdrawFee): void {
  let validator = Validator.load(event.params.validatorId.toString())
  validator.claimedFee = validator.claimedFee.plus(event.params.amount)

  validator.save()
}