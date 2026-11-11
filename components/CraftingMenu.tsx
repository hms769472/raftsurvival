'use client';
import React from 'react';
import {
  WEAPON_TIERS,
  nextWeaponTier,
  RAFT_REPAIR_COST,
  RAFT_REPAIR_AMOUNT,
  EXPAND_COST_BASE,
  EXPAND_COST_STEP,
  TECH_UNLOCK,
  type WeaponTier,
} from '@/lib/balance';

type CraftingMenuProps = {
  onClose: () => void;
  onCraft: (type: string) => void;
  wood: number;
  plastic: number;
  hasRod: boolean;
  hasSpear: boolean;
  hasHammer: boolean;
  hasRainBarrel: boolean;
  hasCampfire: boolean;
  walls: number;
  roofs: number;
  floors: number;
  spearTier: WeaponTier;
  /** RAFT-205: true while the raft or any structure needs repair. */
  needsRepair: boolean;
  /** RAFT-207: number of expansions already bought (drives the cost). */
  expansions: number;
  /** RAFT-208: current wood/plastic cap shown in the header. */
  capacity: number;
  /** RAFT-303: player level; gates the tech tiers below. */
  level: number;
};

export default function CraftingMenu({
  onClose,
  onCraft,
  wood,
  plastic,
  hasRod,
  hasSpear,
  hasHammer,
  hasRainBarrel,
  hasCampfire,
  walls,
  roofs,
  floors,
  spearTier,
  needsRepair,
  expansions,
  capacity,
  level,
}: CraftingMenuProps) {
  const btn = (enabled: boolean, color: string) =>
    'p-2 border-2 text-[10px] flex flex-col items-center gap-1 transition-colors rounded ' +
    (enabled ? color : 'bg-gray-400 border-gray-500 text-gray-200 cursor-not-allowed');
  const nextTier = nextWeaponTier(spearTier);
  const nextTierCost = nextTier ? WEAPON_TIERS[nextTier] : null;
  // RAFT-303: tech tiers require a player level; locked items show the gate.
  const locked = (type: string) => level < (TECH_UNLOCK[type] ?? 1);
  const lockText = (type: string) => `🔒 Requires LV ${TECH_UNLOCK[type] ?? 1}`;
  const canUpgrade =
    hasSpear &&
    nextTierCost !== null &&
    !locked('SPEAR_UPGRADE') &&
    wood >= nextTierCost.wood &&
    plastic >= nextTierCost.plastic;
  // RAFT-205/207: visible, size-scaled costs.
  const canRepair =
    needsRepair && wood >= RAFT_REPAIR_COST.wood && plastic >= RAFT_REPAIR_COST.plastic;
  const expandWood = EXPAND_COST_BASE.wood + EXPAND_COST_STEP.wood * expansions;
  const expandPlastic = EXPAND_COST_BASE.plastic + EXPAND_COST_STEP.plastic * expansions;
  const canExpand = wood >= expandWood && plastic >= expandPlastic;
  return (
    <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-50 pointer-events-auto">
      <div className="bg-[#E6A15E] border-4 border-[#8B4513] p-4 rounded-lg w-[26rem] shadow-2xl max-h-[95%] overflow-y-auto">
        <h2
          className="text-lg font-bold text-[#8B4513] mb-3 text-center"
          style={{ fontFamily: '"Press Start 2P", monospace' }}
        >
          CRAFTING
        </h2>
        <div
          className="flex justify-between text-[10px] text-[#5D4037] mb-3 px-1"
          style={{ fontFamily: '"Press Start 2P", monospace' }}
        >
          <span>
            Wood: {wood}/{capacity}
          </span>
          <span>
            Plastic: {plastic}/{capacity}
          </span>
        </div>
        <div className="flex flex-col gap-1.5">
          <button
            onClick={() => onCraft('REPAIR')}
            disabled={!canRepair}
            className={btn(canRepair, 'bg-[#2ECC71] border-[#27AE60] text-white')}
            style={{ fontFamily: '"Press Start 2P", monospace' }}
          >
            <span>{needsRepair ? 'REPAIR RAFT' : '✓ RAFT OK'}</span>
            <span className="text-[9px]">
              {RAFT_REPAIR_COST.wood} Wood · +{RAFT_REPAIR_AMOUNT} integrity
            </span>
          </button>
          <button
            onClick={() => onCraft('EXPAND')}
            disabled={!canExpand}
            className={btn(canExpand, 'bg-[#27AE60] border-[#1E8449] text-white')}
            style={{ fontFamily: '"Press Start 2P", monospace' }}
          >
            <span>EXPAND RAFT (#{expansions + 1})</span>
            <span className="text-[9px]">
              {expandWood} Wood, {expandPlastic} Plastic
            </span>
          </button>
          <button
            onClick={() => onCraft('ROD')}
            disabled={wood < 5 || hasRod || locked('ROD')}
            className={btn(
              wood >= 5 && !hasRod && !locked('ROD'),
              'bg-[#F39C12] border-[#D68910] text-white',
            )}
            style={{ fontFamily: '"Press Start 2P", monospace' }}
          >
            <span>{hasRod ? '✓ FISHING ROD' : 'FISHING ROD'}</span>
            <span className="text-[9px]">{locked('ROD') ? lockText('ROD') : '5 Wood'}</span>
          </button>
          <button
            onClick={() => onCraft('SPEAR')}
            disabled={wood < 8 || hasSpear || locked('SPEAR')}
            className={btn(
              wood >= 8 && !hasSpear && !locked('SPEAR'),
              'bg-[#E74C3C] border-[#C0392B] text-white',
            )}
            style={{ fontFamily: '"Press Start 2P", monospace' }}
          >
            <span>
              {hasSpear ? `✓ ${WEAPON_TIERS[spearTier].name.toUpperCase()}` : 'WOODEN SPEAR'}
            </span>
            <span className="text-[9px]">
              {locked('SPEAR')
                ? lockText('SPEAR')
                : `8 Wood · DMG ${WEAPON_TIERS[spearTier].damage}`}
            </span>
          </button>
          <button
            onClick={() => onCraft('SPEAR_UPGRADE')}
            disabled={!canUpgrade}
            className={btn(!!canUpgrade, 'bg-[#C0392B] border-[#7B241C] text-white')}
            style={{ fontFamily: '"Press Start 2P", monospace' }}
          >
            <span>
              {nextTier ? `UPGRADE → ${nextTierCost!.name.toUpperCase()}` : '✓ MAX SPEAR TIER'}
            </span>
            <span className="text-[9px]">
              {nextTierCost
                ? locked('SPEAR_UPGRADE')
                  ? lockText('SPEAR_UPGRADE')
                  : `${nextTierCost.wood} Wood, ${nextTierCost.plastic} Plastic · DMG ${nextTierCost.damage}`
                : 'Fully upgraded'}
            </span>
          </button>
          <button
            onClick={() => onCraft('HAMMER')}
            disabled={wood < 8 || hasHammer || locked('HAMMER')}
            className={btn(
              wood >= 8 && !hasHammer && !locked('HAMMER'),
              'bg-[#8E44AD] border-[#6C3483] text-white',
            )}
            style={{ fontFamily: '"Press Start 2P", monospace' }}
          >
            <span>{hasHammer ? '✓ HAMMER' : 'HAMMER 🔨'}</span>
            <span className="text-[9px]">
              {locked('HAMMER') ? lockText('HAMMER') : '8 Wood (Unlocks Building)'}
            </span>
          </button>
          <div
            className="p-2 border-2 border-dashed border-[#8B4513] rounded text-[9px] text-[#5D4037]"
            style={{ fontFamily: '"Press Start 2P", monospace' }}
          >
            <div className="mb-1">BUILD MODE (in game)</div>
            <div>Press B · 1-6 pick · R rotate · T material</div>
            <div className="mt-1">
              Walls {walls} · Roofs {roofs} · Floors {floors}
            </div>
          </div>
          <button
            onClick={() => onCraft('RAIN_BARREL')}
            disabled={wood < 6 || !hasHammer || hasRainBarrel || locked('RAIN_BARREL')}
            className={btn(
              wood >= 6 && hasHammer && !hasRainBarrel && !locked('RAIN_BARREL'),
              'bg-[#2980B9] border-[#1F618D] text-white',
            )}
            style={{ fontFamily: '"Press Start 2P", monospace' }}
          >
            <span>{hasRainBarrel ? '✓ RAIN BARREL' : 'RAIN BARREL 🌧️'}</span>
            <span className="text-[9px]">
              {locked('RAIN_BARREL') ? lockText('RAIN_BARREL') : '6 Wood'}
            </span>
          </button>
          <button
            onClick={() => onCraft('CAMPFIRE')}
            disabled={wood < 5 || !hasHammer || hasCampfire || locked('CAMPFIRE')}
            className={btn(
              wood >= 5 && hasHammer && !hasCampfire && !locked('CAMPFIRE'),
              'bg-[#E67E22] border-[#A04000] text-white',
            )}
            style={{ fontFamily: '"Press Start 2P", monospace' }}
          >
            <span>{hasCampfire ? '✓ CAMPFIRE' : 'CAMPFIRE 🔥'}</span>
            <span className="text-[9px]">
              {locked('CAMPFIRE') ? lockText('CAMPFIRE') : '5 Wood'}
            </span>
          </button>
        </div>
        <button
          onClick={onClose}
          className="mt-4 w-full bg-[#E74C3C] text-white p-2.5 border-2 border-[#8B0000] text-[10px]"
          style={{ fontFamily: '"Press Start 2P", monospace' }}
        >
          CLOSE
        </button>
      </div>
    </div>
  );
}
