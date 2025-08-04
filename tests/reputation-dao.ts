import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { ReputationDao } from "../target/types/reputation_dao";
import { PublicKey, Keypair, SystemProgram, SYSVAR_RENT_PUBKEY } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, createMint, createAccount, mintTo } from "@solana/spl-token";
import { expect } from "chai";

describe("reputation-dao", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.ReputationDao as Program<ReputationDao>;
  
  let scoreboardKeypair: Keypair;
  let mint: PublicKey;
  let userTokenAccount: PublicKey;
  let userKeypair: Keypair;
  let memberKeypair: Keypair;
  let voterKeypair: Keypair;
  let targetKeypair: Keypair;

  before(async () => {
    // Create test keypairs
    userKeypair = Keypair.generate();
    memberKeypair = Keypair.generate();
    voterKeypair = Keypair.generate();
    targetKeypair = Keypair.generate();
    scoreboardKeypair = Keypair.generate();

    // Airdrop SOL to test accounts
    await provider.connection.requestAirdrop(userKeypair.publicKey, 10 * anchor.web3.LAMPORTS_PER_SOL);
    await provider.connection.requestAirdrop(memberKeypair.publicKey, 10 * anchor.web3.LAMPORTS_PER_SOL);
    await provider.connection.requestAirdrop(voterKeypair.publicKey, 10 * anchor.web3.LAMPORTS_PER_SOL);
    await provider.connection.requestAirdrop(targetKeypair.publicKey, 10 * anchor.web3.LAMPORTS_PER_SOL);

    // Create test token mint
    mint = await createMint(
      provider.connection,
      userKeypair,
      userKeypair.publicKey,
      null,
      9
    );

    // Create token account for user
    userTokenAccount = await createAccount(
      provider.connection,
      userKeypair,
      mint,
      userKeypair.publicKey
    );

    // Mint tokens to user
    await mintTo(
      provider.connection,
      userKeypair,
      mint,
      userTokenAccount,
      userKeypair,
      1000000000 // 1 billion tokens
    );
  });

  it("Initializes the scoreboard", async () => {
    const minTokenAmount = new anchor.BN(1000000); // 1M tokens
    const voteCooldown = new anchor.BN(3600); // 1 hour
    const reputationMultiplier = 2;

    const [scoreboardPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("scoreboard")],
      program.programId
    );

    await program.methods
      .initializeScoreboard(minTokenAmount, voteCooldown, reputationMultiplier)
      .accounts({
        scoreboard: scoreboardPda,
        authority: provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    const scoreboard = await program.account.scoreboard.fetch(scoreboardPda);
    expect(scoreboard.authority.toString()).to.equal(provider.wallet.publicKey.toString());
    expect(scoreboard.minTokenAmount.toNumber()).to.equal(1000000);
    expect(scoreboard.voteCooldown.toNumber()).to.equal(3600);
    expect(scoreboard.reputationMultiplier).to.equal(2);
    expect(scoreboard.totalMembers).to.equal(0);
    expect(scoreboard.totalReputation.toNumber()).to.equal(0);
  });

  it("Registers a new member", async () => {
    const initialReputation = new anchor.BN(50);

    const [memberPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("member"), memberKeypair.publicKey.toBuffer()],
      program.programId
    );

    const [scoreboardPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("scoreboard")],
      program.programId
    );

    await program.methods
      .registerMember(initialReputation)
      .accounts({
        member: memberPda,
        wallet: memberKeypair.publicKey,
        scoreboard: scoreboardPda,
        systemProgram: SystemProgram.programId,
      })
      .signers([memberKeypair])
      .rpc();

    const member = await program.account.member.fetch(memberPda);
    expect(member.wallet.toString()).to.equal(memberKeypair.publicKey.toString());
    expect(member.reputation.toNumber()).to.equal(50);
    expect(member.totalUpvotes).to.equal(0);
    expect(member.totalDownvotes).to.equal(0);
    expect(member.lastVoteTime.toNumber()).to.equal(0);
    expect(member.role).to.deep.equal({ member: {} });

    const scoreboard = await program.account.scoreboard.fetch(scoreboardPda);
    expect(scoreboard.totalMembers).to.equal(1);
    expect(scoreboard.totalReputation.toNumber()).to.equal(50);
  });

  it("Registers a voter member", async () => {
    const initialReputation = new anchor.BN(100);

    const [voterPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("member"), voterKeypair.publicKey.toBuffer()],
      program.programId
    );

    const [scoreboardPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("scoreboard")],
      program.programId
    );

    await program.methods
      .registerMember(initialReputation)
      .accounts({
        member: voterPda,
        wallet: voterKeypair.publicKey,
        scoreboard: scoreboardPda,
        systemProgram: SystemProgram.programId,
      })
      .signers([voterKeypair])
      .rpc();

    const voter = await program.account.member.fetch(voterPda);
    expect(voter.wallet.toString()).to.equal(voterKeypair.publicKey.toString());
    expect(voter.reputation.toNumber()).to.equal(100);
  });

  it("Registers a target member", async () => {
    const initialReputation = new anchor.BN(25);

    const [targetPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("member"), targetKeypair.publicKey.toBuffer()],
      program.programId
    );

    const [scoreboardPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("scoreboard")],
      program.programId
    );

    await program.methods
      .registerMember(initialReputation)
      .accounts({
        member: targetPda,
        wallet: targetKeypair.publicKey,
        scoreboard: scoreboardPda,
        systemProgram: SystemProgram.programId,
      })
      .signers([targetKeypair])
      .rpc();

    const target = await program.account.member.fetch(targetPda);
    expect(target.wallet.toString()).to.equal(targetKeypair.publicKey.toString());
    expect(target.reputation.toNumber()).to.equal(25);
  });

  it("Votes up on a member", async () => {
    const voteAmount = new anchor.BN(10);

    const [voterPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("member"), voterKeypair.publicKey.toBuffer()],
      program.programId
    );

    const [targetPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("member"), targetKeypair.publicKey.toBuffer()],
      program.programId
    );

    const [scoreboardPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("scoreboard")],
      program.programId
    );

    // Create token account for voter
    const voterTokenAccount = await createAccount(
      provider.connection,
      voterKeypair,
      mint,
      voterKeypair.publicKey
    );

    // Mint tokens to voter
    await mintTo(
      provider.connection,
      voterKeypair,
      mint,
      voterTokenAccount,
      userKeypair,
      1000000000 // 1 billion tokens
    );

    await program.methods
      .voteMember({ upvote: {} }, voteAmount)
      .accounts({
        voter: voterPda,
        target: targetPda,
        scoreboard: scoreboardPda,
        voterTokenAccount: voterTokenAccount,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([voterKeypair])
      .rpc();

    const voter = await program.account.member.fetch(voterPda);
    const target = await program.account.member.fetch(targetPda);
    const scoreboard = await program.account.scoreboard.fetch(scoreboardPda);

    expect(voter.totalUpvotes).to.equal(1);
    expect(target.reputation.toNumber()).to.equal(45); // 25 + (10 * 2)
    expect(scoreboard.totalReputation.toNumber()).to.equal(195); // 50 + 100 + 45
  });

  it("Votes down on a member", async () => {
    const voteAmount = new anchor.BN(5);

    const [voterPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("member"), voterKeypair.publicKey.toBuffer()],
      program.programId
    );

    const [targetPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("member"), targetKeypair.publicKey.toBuffer()],
      program.programId
    );

    const [scoreboardPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("scoreboard")],
      program.programId
    );

    // Create token account for voter
    const voterTokenAccount = await createAccount(
      provider.connection,
      voterKeypair,
      mint,
      voterKeypair.publicKey
    );

    // Mint tokens to voter
    await mintTo(
      provider.connection,
      voterKeypair,
      mint,
      voterTokenAccount,
      userKeypair,
      1000000000 // 1 billion tokens
    );

    await program.methods
      .voteMember({ downvote: {} }, voteAmount)
      .accounts({
        voter: voterPda,
        target: targetPda,
        scoreboard: scoreboardPda,
        voterTokenAccount: voterTokenAccount,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([voterKeypair])
      .rpc();

    const voter = await program.account.member.fetch(voterPda);
    const target = await program.account.member.fetch(targetPda);
    const scoreboard = await program.account.scoreboard.fetch(scoreboardPda);

    expect(voter.totalDownvotes).to.equal(1);
    expect(target.reputation.toNumber()).to.equal(35); // 45 - (5 * 2)
    expect(scoreboard.totalReputation.toNumber()).to.equal(185); // 195 - 10
  });

  it("Prevents voting with insufficient tokens", async () => {
    const voteAmount = new anchor.BN(10);

    const [voterPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("member"), voterKeypair.publicKey.toBuffer()],
      program.programId
    );

    const [targetPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("member"), targetKeypair.publicKey.toBuffer()],
      program.programId
    );

    const [scoreboardPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("scoreboard")],
      program.programId
    );

    // Create token account with insufficient tokens
    const insufficientTokenAccount = await createAccount(
      provider.connection,
      voterKeypair,
      mint,
      voterKeypair.publicKey
    );

    // Mint only 100 tokens (less than required 1M)
    await mintTo(
      provider.connection,
      voterKeypair,
      mint,
      insufficientTokenAccount,
      userKeypair,
      100
    );

    try {
      await program.methods
        .voteMember({ upvote: {} }, voteAmount)
        .accounts({
          voter: voterPda,
          target: targetPda,
          scoreboard: scoreboardPda,
          voterTokenAccount: insufficientTokenAccount,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .signers([voterKeypair])
        .rpc();
      expect.fail("Should have thrown an error");
    } catch (error) {
      expect(error.toString()).to.include("InsufficientTokens");
    }
  });

  it("Prevents voting during cooldown", async () => {
    const voteAmount = new anchor.BN(10);

    const [voterPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("member"), voterKeypair.publicKey.toBuffer()],
      program.programId
    );

    const [targetPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("member"), targetKeypair.publicKey.toBuffer()],
      program.programId
    );

    const [scoreboardPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("scoreboard")],
      program.programId
    );

    // Create token account for voter
    const voterTokenAccount = await createAccount(
      provider.connection,
      voterKeypair,
      mint,
      voterKeypair.publicKey
    );

    // Mint tokens to voter
    await mintTo(
      provider.connection,
      voterKeypair,
      mint,
      voterTokenAccount,
      userKeypair,
      1000000000 // 1 billion tokens
    );

    try {
      await program.methods
        .voteMember({ upvote: {} }, voteAmount)
        .accounts({
          voter: voterPda,
          target: targetPda,
          scoreboard: scoreboardPda,
          voterTokenAccount: voterTokenAccount,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .signers([voterKeypair])
        .rpc();
      expect.fail("Should have thrown an error");
    } catch (error) {
      expect(error.toString()).to.include("VoteCooldownActive");
    }
  });

  it("Upgrades member role based on reputation", async () => {
    const bonusAmount = new anchor.BN(200);

    const [memberPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("member"), memberKeypair.publicKey.toBuffer()],
      program.programId
    );

    const [scoreboardPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("scoreboard")],
      program.programId
    );

    await program.methods
      .awardBonus(bonusAmount, "Outstanding contribution")
      .accounts({
        member: memberPda,
        scoreboard: scoreboardPda,
        authority: provider.wallet.publicKey,
      })
      .rpc();

    const member = await program.account.member.fetch(memberPda);
    expect(member.reputation.toNumber()).to.equal(250); // 50 + 200
    expect(member.role).to.deep.equal({ contributor: {} }); // 100-499 reputation = Contributor
  });

  it("Resets member reputation", async () => {
    const [memberPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("member"), memberKeypair.publicKey.toBuffer()],
      program.programId
    );

    const [scoreboardPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("scoreboard")],
      program.programId
    );

    await program.methods
      .resetReputation()
      .accounts({
        member: memberPda,
        scoreboard: scoreboardPda,
        authority: provider.wallet.publicKey,
      })
      .rpc();

    const member = await program.account.member.fetch(memberPda);
    const scoreboard = await program.account.scoreboard.fetch(scoreboardPda);

    expect(member.reputation.toNumber()).to.equal(0);
    expect(member.totalUpvotes).to.equal(0);
    expect(member.totalDownvotes).to.equal(0);
    expect(member.role).to.deep.equal({ member: {} });
    expect(scoreboard.totalReputation.toNumber()).to.equal(185); // Reduced by 250
  });

  it("Updates scoreboard parameters", async () => {
    const newMinTokenAmount = new anchor.BN(2000000); // 2M tokens
    const newVoteCooldown = new anchor.BN(7200); // 2 hours
    const newReputationMultiplier = 3;

    const [scoreboardPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("scoreboard")],
      program.programId
    );

    await program.methods
      .updateScoreboardParams(newMinTokenAmount, newVoteCooldown, newReputationMultiplier)
      .accounts({
        scoreboard: scoreboardPda,
        authority: provider.wallet.publicKey,
      })
      .rpc();

    const scoreboard = await program.account.scoreboard.fetch(scoreboardPda);
    expect(scoreboard.minTokenAmount.toNumber()).to.equal(2000000);
    expect(scoreboard.voteCooldown.toNumber()).to.equal(7200);
    expect(scoreboard.reputationMultiplier).to.equal(3);
  });

  it("Awards bonus reputation", async () => {
    const bonusAmount = new anchor.BN(100);
    const reason = "Excellent work on the project";

    const [memberPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("member"), memberKeypair.publicKey.toBuffer()],
      program.programId
    );

    const [scoreboardPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("scoreboard")],
      program.programId
    );

    await program.methods
      .awardBonus(bonusAmount, reason)
      .accounts({
        member: memberPda,
        scoreboard: scoreboardPda,
        authority: provider.wallet.publicKey,
      })
      .rpc();

    const member = await program.account.member.fetch(memberPda);
    const scoreboard = await program.account.scoreboard.fetch(scoreboardPda);

    expect(member.reputation.toNumber()).to.equal(100);
    expect(scoreboard.totalReputation.toNumber()).to.equal(285); // 185 + 100
  });
}); 