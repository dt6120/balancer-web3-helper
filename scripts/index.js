const { ethers } = require("hardhat");
const { weth, usdc, vault, lp_token, pool_id } = require("./getPoolInfo");

const main = async () => {
  // await swap(weth, usdc, 0.008);
  // await swap(usdc, weth, 1);
  // await joinPool(weth, 1, usdc, 2700);
  await exitPool(weth, usdc, 100);
};

const swap = async (token0, token1, amount) => {
  const [signer] = await ethers.getSigners();

  amount = amount * 10 ** (await token0.decimals());

  console.log(`\n>>> Swapping ${amount} ${await token0.symbol()} for ${await token1.symbol()}`);

  const singleSwap = [pool_id, 0, token0.address, token1.address, amount.toString(), "0x"];
  const fundManagement = [signer.address, false, signer.address, false];
  const limit = (Math.round(amount * 0.99)).toString(); // allow 1% slippage
  const deadline = "1623028413";

  const tx = await vault.connect(signer).swap(
    singleSwap,
    fundManagement,
    "0", // limit,
    deadline,
    { gasLimit: 2000000 }
  );
  const receipt = await tx.wait();

  console.log(`\n>>> Swap successful`);
};

const joinPool = async (token0, amount0, token1, amount1) => {
  const [signer] = await ethers.getSigners();

  console.log(`\n>>> Joining pool`);
  console.log(`\n>>> Adding ${amount0} ${await token0.symbol()} and ${amount1} ${await token1.symbol()}`);

  amount0 = amount0 * 10 ** (await token0.decimals());
  amount1 = amount1 * 10 ** (await token1.decimals());

  if (token0 === usdc.address) {
    await usdc.connect(signer).approve(vault.address, amount0);
  } else {
    await usdc.connect(signer).approve(vault.address, amount1);
  }

  const assets = token0.address < token1.address ? [token0.address, token1.address] : [token1.address, token0.address];
  const maxAmountsIn = token0.address < token1.address ? [amount0.toString(), amount1.toString()] : [amount1.toString(), amount0.toString()];

  const userData = ethers.utils.defaultAbiCoder.encode(['uint256', 'uint256[]'], [1, maxAmountsIn]);

  const request = [
    assets,
    maxAmountsIn,
    userData,
    false
  ];

  const tx = await vault.connect(signer).joinPool(
    pool_id,
    signer.address,
    signer.address,
    request,
    { gasLimit: 2000000 }
  );
  const receipt = await tx.wait();

  console.log(`\n>>> Liquidity added`);
};

const exitPool = async (token0, token1, share) => {
  const [signer] = await ethers.getSigners();

  const total_lp = await lp_token.balanceOf(signer.address);

  console.log(`\n>>> Exiting pool`);
  console.log(`\n>>> Removing ${share} LP tokens out of total ${(total_lp / 1e18).toString()} LP tokens`);

  share = (share * 10 ** 18).toString();

  const assets = [token0.address, token1.address].sort();
  const minAmountOut = ['3988000000', '19950000000000000'];

  const userData = ethers.utils.defaultAbiCoder.encode(['uint256', 'uint256'], [1, share]);

  const request = [
    assets,
    minAmountOut,
    userData,
    false
  ];

  const tx = await vault.connect(signer).exitPool(
    pool_id,
    signer.address,
    signer.address,
    request,
    { gasLimit: 2000000 }
  );
  const receipt = await tx.wait();

  console.log(`\n>>> Liquidity removed`);
};


main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
