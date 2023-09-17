import {initApi, api} from './api.js';
import {Events} from "./events.js";
import xyk from "./handlers/xyk.js";
import lbp from "./handlers/lbp.js";
import omnipool from "./handlers/omnipool.js";
import transfers from "./handlers/transfers.js";
import otc from "./handlers/otc.js";
import dca from "./handlers/dca.js";
import staking from "./handlers/staking.js";
import {initDiscord} from "./discord.js";
import {rpc, sha, token, channel} from "./config.js";
import {currenciesHandler} from "./currencies.js";

async function main() {
  console.log('🐍⌚');
  console.log('snakewatch', sha);
  await initApi(rpc);
  const {rpc: {system}} = api();
  const [chain, version] = await Promise.all([system.chain(), system.version()]);
  console.log(`connected to ${rpc} (${chain} ${version})`);
  await initDiscord(token, channel);

  const events = new Events();
  events.addHandler(currenciesHandler);
  events.addHandler(xyk);
  events.addHandler(lbp);
  events.addHandler(omnipool);
  events.addHandler(otc);
  events.addHandler(dca)
  events.addHandler(transfers);
  events.addHandler(staking);

  if (process.env.NODE_ENV === 'test') {
    console.log('testing mode: pushing testing blocks');
    const blockNumbers = new Set([]);
    blockNumbers.add(3421767);
    blockNumbers.add(3423823);
    blockNumbers.add(3423655);
    blockNumbers.add(3422996);

    for (const height of [...blockNumbers].sort()) {
      await events.emitFromBlock(height);
    }
    const lookBack = 100;
    console.log(`testing mode: pushing last ${lookBack} blocks`);
    const lastBlock = await api().query.system.number();
    for (let i = lastBlock - lookBack; i <= lastBlock; i++) {
      await events.emitFromBlock(i);
    }
  }

  console.log('watching for new blocks');
  events.startWatching();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});




