import { ChangeLifetimeCall } from '../../generated/SchainsInternal/SchainsInternal'
import { Schain } from '../../generated/schema'



export function handleChangeLifetime(call: ChangeLifetimeCall): void {
  let schain = Schain.load(call.inputs.schainId.toString())

  schain.lifetime = schain.lifetime.plus(call.inputs.lifetime)
  schain.deposit = schain.lifetime.plus(call.inputs.deposit)

  schain.save()
}
