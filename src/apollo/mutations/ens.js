import {
  getProvider,
  getResolverContract,
  setupENS,
  namehash
} from '@ensdomains/ui'
import { isENSReadyReactive } from '../reactiveVars'

const INFURA_ID =
  window.location.host === 'app.ens.domains'
    ? '90f210707d3c450f847659dc9a3436ea'
    : '58a380d3ecd545b2b5b3dad5d2b18bf0'

let ens = {},
  registrar = {},
  ensRegistryAddress = undefined

export async function setup({
  reloadOnAccountsChange,
  enforceReadOnly,
  enforceReload,
  customProvider,
  ensAddress
}) {
  let option = {
    reloadOnAccountsChange: false,
    enforceReadOnly,
    enforceReload,
    customProvider,
    ensAddress
  }
  if (enforceReadOnly) {
    option.infura = INFURA_ID
  }
  ensAddress = '0xC7b7224F76dD98bE23b717668d55cB40E9B3DF7f'
  const {
    ens: ensInstance,
    registrar: registrarInstance,
    providerObject
  } = await setupENS(option)
  ens = ensInstance
  registrar = registrarInstance
  ensRegistryAddress = ensAddress

  registrar.permanentRegistrarController = registrar.permanentRegistrarController.attach(
    '0x5fC75700E7ef0dF96D0BBf55b251ca640611786F'
  )
  registrar.legacyAuctionRegistrar = registrar.legacyAuctionRegistrar.attach(
    '0xAF55A6546c7FFD366E68BaF7D103490e6C78d679'
  )
  // DummyOracle address: 0xAF55A6546c7FFD366E68BaF7D103490e6C78d679
  // StablePriceOracle address: 0xFCa5B811d0e86f325B0cC6608bA9d5b828144253
  async function getAddress(name) {
    console.log(`getAddress 1`, name)
    if (name === 'resolver.eth') {
      // return '0x898BE98CC743bf914CA52C648897527ffD14B024'
    }
    const provider = await getProvider()
    console.log(`getAddress 2:`, name)
    let hash
    try {
      hash = namehash(name)
    } catch (e) {
      console.log(`name hash fail`, e)
    }
    console.log(`resolver fetch for ${hash} ${name}`)
    const resolverAddr = await registrar.ENS.resolver(hash)
    console.log(`resolver`, resolverAddr)
    const Resolver = getResolverContract({ address: resolverAddr, provider })
    return Resolver['addr(bytes32)'](hash)
  }
  async function getEthPrice() {
    const oracleens = 'eth-usd.data.eth'
    const that = registrar
    try {
      console.log(`getEthPrice 1`)
      const contractAddress = await getAddress(oracleens)
      // const contractAddress = await that.getAddress(oracleens)
      console.log(`get address of ${oracleens}`, contractAddress)
      // const contractAddress = '0xAF55A6546c7FFD366E68BaF7D103490e6C78d679'
      const oracle = await that.getOracle(contractAddress)
      console.log(`get oracle of ${contractAddress}`, oracle)
      let p = await oracle
        .latestAnswer()
        .then(res => {
          console.log(`price is `, res, res.toNumber())
          return res
        })
        .catch(err => {
          console.log(`latest answer fail`, err)
        })
      return p.toNumber() / 100000000
    } catch (e) {
      console.warn(
        `Either ${oracleens} does not exist or Oracle is not throwing an error`,
        e
      )
    }
  }
  // await getEthPrice()
  // registrar.getEthPrice = getEthPrice;
  // registrar.getAddress = getAddress;
  async function getEthResolver(ENS) {
    console.log(`getEthResolver `)
    // const resolverAddr = await ENS.resolver(namehash('eth'))
    const provider = await getProvider()
    return getResolverContract({
      address: '0x898BE98CC743bf914CA52C648897527ffD14B024',
      provider
    })
  }
  // registrar.getEthResolver = getEthResolver;

  console.log(`ens`, ens)
  console.log(`registrar`, registrar)
  console.log(`ensAddress`, ensRegistryAddress)

  isENSReadyReactive(true)
  return { ens, registrar, providerObject }
}

export function getRegistrar() {
  return registrar
}

export function getEnsAddress() {
  return ensRegistryAddress
}

export default function getENS() {
  return ens
}
