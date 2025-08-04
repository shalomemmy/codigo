use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[program]
pub mod reputation_dao {
    use super::*;

    /// Initialize the reputation scoreboard
    pub fn initialize_scoreboard(
        ctx: Context<InitializeScoreboard>,
        min_token_amount: u64,
        vote_cooldown: i64,
        reputation_multiplier: u8,
    ) -> Result<()> {
        let scoreboard = &mut ctx.accounts.scoreboard;
        scoreboard.authority = ctx.accounts.authority.key();
        scoreboard.min_token_amount = min_token_amount;
        scoreboard.vote_cooldown = vote_cooldown;
        scoreboard.reputation_multiplier = reputation_multiplier;
        scoreboard.total_members = 0;
        scoreboard.total_reputation = 0;
        scoreboard.bump = *ctx.bumps.get("scoreboard").unwrap();
        Ok(())
    }

    /// Register a new member
    pub fn register_member(
        ctx: Context<RegisterMember>,
        initial_reputation: u64,
    ) -> Result<()> {
        let member = &mut ctx.accounts.member;
        let scoreboard = &mut ctx.accounts.scoreboard;

        member.wallet = ctx.accounts.wallet.key();
        member.reputation = initial_reputation;
        member.total_upvotes = 0;
        member.total_downvotes = 0;
        member.last_vote_time = 0;
        member.role = MemberRole::Member;
        member.bump = *ctx.bumps.get("member").unwrap();

        scoreboard.total_members += 1;
        scoreboard.total_reputation += initial_reputation;

        emit!(MemberRegistered {
            wallet: member.wallet,
            reputation: member.reputation,
        });

        Ok(())
    }

    /// Vote on a member's reputation
    pub fn vote_member(
        ctx: Context<VoteMember>,
        vote_type: VoteType,
        amount: u64,
    ) -> Result<()> {
        let voter = &mut ctx.accounts.voter;
        let target = &mut ctx.accounts.target;
        let scoreboard = &mut ctx.accounts.scoreboard;
        let clock = Clock::get()?;

        // Check token balance requirement
        require!(
            ctx.accounts.voter_token_account.amount >= scoreboard.min_token_amount,
            ReputationError::InsufficientTokens
        );

        // Check cooldown
        require!(
            clock.unix_timestamp - voter.last_vote_time >= scoreboard.vote_cooldown,
            ReputationError::VoteCooldownActive
        );

        // Calculate reputation change
        let reputation_change = match vote_type {
            VoteType::Upvote => {
                voter.total_upvotes += 1;
                amount * scoreboard.reputation_multiplier as u64
            }
            VoteType::Downvote => {
                voter.total_downvotes += 1;
                -(amount as i64) * scoreboard.reputation_multiplier as i64
            }
        };

        // Update target reputation
        if reputation_change > 0 {
            target.reputation += reputation_change as u64;
            scoreboard.total_reputation += reputation_change as u64;
        } else {
            let abs_change = reputation_change.abs() as u64;
            target.reputation = target.reputation.saturating_sub(abs_change);
            scoreboard.total_reputation = scoreboard.total_reputation.saturating_sub(abs_change);
        }

        // Update voter's last vote time
        voter.last_vote_time = clock.unix_timestamp;

        // Check for role upgrades
        check_role_upgrade(target)?;

        emit!(MemberVoted {
            voter: voter.wallet,
            target: target.wallet,
            vote_type,
            reputation_change: reputation_change as i64,
        });

        Ok(())
    }

    /// Reset reputation for a member (admin only)
    pub fn reset_reputation(ctx: Context<ResetReputation>) -> Result<()> {
        let member = &mut ctx.accounts.member;
        let scoreboard = &mut ctx.accounts.scoreboard;

        let old_reputation = member.reputation;
        member.reputation = 0;
        member.total_upvotes = 0;
        member.total_downvotes = 0;
        member.role = MemberRole::Member;

        scoreboard.total_reputation = scoreboard.total_reputation.saturating_sub(old_reputation);

        emit!(ReputationReset {
            wallet: member.wallet,
            old_reputation,
        });

        Ok(())
    }

    /// Update scoreboard parameters (admin only)
    pub fn update_scoreboard_params(
        ctx: Context<UpdateScoreboardParams>,
        min_token_amount: u64,
        vote_cooldown: i64,
        reputation_multiplier: u8,
    ) -> Result<()> {
        let scoreboard = &mut ctx.accounts.scoreboard;
        scoreboard.min_token_amount = min_token_amount;
        scoreboard.vote_cooldown = vote_cooldown;
        scoreboard.reputation_multiplier = reputation_multiplier;

        emit!(ScoreboardUpdated {
            min_token_amount,
            vote_cooldown,
            reputation_multiplier,
        });

        Ok(())
    }

    /// Award reputation bonus (admin only)
    pub fn award_bonus(
        ctx: Context<AwardBonus>,
        bonus_amount: u64,
        reason: String,
    ) -> Result<()> {
        let member = &mut ctx.accounts.member;
        let scoreboard = &mut ctx.accounts.scoreboard;

        member.reputation += bonus_amount;
        scoreboard.total_reputation += bonus_amount;

        check_role_upgrade(member)?;

        emit!(BonusAwarded {
            wallet: member.wallet,
            bonus_amount,
            reason,
        });

        Ok(())
    }
}

#[derive(Accounts)]
pub struct InitializeScoreboard<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + Scoreboard::INIT_SPACE,
        seeds = [b"scoreboard"],
        bump
    )]
    pub scoreboard: Account<'info, Scoreboard>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct RegisterMember<'info> {
    #[account(
        init,
        payer = wallet,
        space = 8 + Member::INIT_SPACE,
        seeds = [b"member", wallet.key().as_ref()],
        bump
    )]
    pub member: Account<'info, Member>,
    #[account(mut)]
    pub wallet: Signer<'info>,
    #[account(mut)]
    pub scoreboard: Account<'info, Scoreboard>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct VoteMember<'info> {
    #[account(mut)]
    pub voter: Account<'info, Member>,
    #[account(mut)]
    pub target: Account<'info, Member>,
    #[account(mut)]
    pub scoreboard: Account<'info, Scoreboard>,
    pub voter_token_account: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct ResetReputation<'info> {
    #[account(mut)]
    pub member: Account<'info, Member>,
    #[account(mut)]
    pub scoreboard: Account<'info, Scoreboard>,
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct UpdateScoreboardParams<'info> {
    #[account(mut)]
    pub scoreboard: Account<'info, Scoreboard>,
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct AwardBonus<'info> {
    #[account(mut)]
    pub member: Account<'info, Member>,
    #[account(mut)]
    pub scoreboard: Account<'info, Scoreboard>,
    pub authority: Signer<'info>,
}

#[account]
#[derive(InitSpace)]
pub struct Scoreboard {
    pub authority: Pubkey,
    pub min_token_amount: u64,
    pub vote_cooldown: i64,
    pub reputation_multiplier: u8,
    pub total_members: u32,
    pub total_reputation: u64,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct Member {
    pub wallet: Pubkey,
    pub reputation: u64,
    pub total_upvotes: u32,
    pub total_downvotes: u32,
    pub last_vote_time: i64,
    pub role: MemberRole,
    pub bump: u8,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum MemberRole {
    Member,
    Contributor,
    Moderator,
    Admin,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum VoteType {
    Upvote,
    Downvote,
}

fn check_role_upgrade(member: &mut Account<Member>) -> Result<()> {
    let new_role = match member.reputation {
        0..=99 => MemberRole::Member,
        100..=499 => MemberRole::Contributor,
        500..=999 => MemberRole::Moderator,
        _ => MemberRole::Admin,
    };

    if new_role != member.role {
        member.role = new_role;
        emit!(RoleUpgraded {
            wallet: member.wallet,
            new_role,
        });
    }

    Ok(())
}

#[error_code]
pub enum ReputationError {
    #[msg("Insufficient tokens to vote")]
    InsufficientTokens,
    #[msg("Vote cooldown is still active")]
    VoteCooldownActive,
    #[msg("Invalid vote type")]
    InvalidVoteType,
}

#[event]
pub struct MemberRegistered {
    pub wallet: Pubkey,
    pub reputation: u64,
}

#[event]
pub struct MemberVoted {
    pub voter: Pubkey,
    pub target: Pubkey,
    pub vote_type: VoteType,
    pub reputation_change: i64,
}

#[event]
pub struct ReputationReset {
    pub wallet: Pubkey,
    pub old_reputation: u64,
}

#[event]
pub struct ScoreboardUpdated {
    pub min_token_amount: u64,
    pub vote_cooldown: i64,
    pub reputation_multiplier: u8,
}

#[event]
pub struct BonusAwarded {
    pub wallet: Pubkey,
    pub bonus_amount: u64,
    pub reason: String,
}

#[event]
pub struct RoleUpgraded {
    pub wallet: Pubkey,
    pub new_role: MemberRole,
} 