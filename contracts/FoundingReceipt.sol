// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v5.4.0/contracts/token/ERC721/ERC721.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v5.4.0/contracts/access/Ownable.sol";

/**
 * Rent Resilience Founding Receipt
 *
 * A receipt, not an asset: each token marks one verified 1¢ opt-in payment on Base
 * (see site/src/index.js, /api/confirm). It proves the holder was here before the
 * protocol had a product. No royalties, no staking claims, nothing to speculate on.
 *
 * Mint flow:
 *   1. Payer sends >= 0.01 USDC to the opt-in address (QR / tap-to-pay on the site).
 *   2. They confirm the tx hash on the site; the backend verifies it onchain.
 *   3. `claim(txHash)` mints them a receipt keyed to that hash (one per hash).
 *   4. `tokenId` equals their position on the opt-in list (mint count).
 *
 * Ownership of the contract is administrative only (baseURI for metadata, and
 * pausing claims if the opt-in closes). It cannot move payer funds; USDC settled
 * directly to the payTo address at payment time and never touches this contract.
 */
contract FoundingReceipt is ERC721, Ownable {
    string private _baseTokenURI;
    uint256 private _minted;
    mapping(bytes32 => bool) private _claimed;

    event Claimed(bytes32 indexed txHash, address indexed claimant, uint256 tokenId);

    constructor(string memory baseTokenURI)
        ERC721("Rent Resilience Founding Receipt", "RENTRCPT")
        Ownable(msg.sender)
    {
        _baseTokenURI = baseTokenURI;
    }

    function claim(bytes32 txHash) external {
        require(!_claimed[txHash], "already claimed");
        _claimed[txHash] = true;
        _minted += 1;
        _safeMint(msg.sender, _minted);
        emit Claimed(txHash, msg.sender, _minted);
    }

    function totalMinted() external view returns (uint256) {
        return _minted;
    }

    function claimable(bytes32 txHash) external view returns (bool) {
        return !_claimed[txHash];
    }

    function setBaseURI(string calldata baseTokenURI) external onlyOwner {
        _baseTokenURI = baseTokenURI;
    }

    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
    }
}
