import React, { useState } from 'react';
import { Item, Claim } from '../types';
import { claimService, SAFE_CAMPUS_HUBS } from '../services/claimService';
import { itemService } from '../services/itemService';
import { X, ShieldCheck, CheckCircle2, AlertCircle, Building2, MapPin, Check, Compass } from 'lucide-react';
import { VerificationShield3D } from './3d/VerificationShield3D';
import { NriCampusMap } from './maps/NriCampusMap';

interface OwnershipVerifyModalProps {
  lostItem: Item;
  foundItem: Item;
  currentUserId: string;
  matchId?: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const OwnershipVerifyModal: React.FC<OwnershipVerifyModalProps> = ({
  lostItem,
  foundItem,
  currentUserId,
  matchId,
  onClose,
  onSuccess,
}) => {
  const [answer, setAnswer] = useState('');
  const [selectedHub, setSelectedHub] = useState<string>(SAFE_CAMPUS_HUBS[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [show3dMap, setShow3dMap] = useState(false);
  const [claimResult, setClaimResult] = useState<{
    claim: Claim;
    verified: boolean;
    message: string;
  } | null>(null);

  // Load existing claim if present
  React.useEffect(() => {
    claimService.getClaimByItems(lostItem.id, foundItem.id).then((existingClaim) => {
      if (existingClaim) {
        setClaimResult({
          claim: existingClaim,
          verified: existingClaim.status === 'verified',
          message: 'Existing claim found.',
        });
        if (existingClaim.safe_exchange_location) {
          setSelectedHub(existingClaim.safe_exchange_location);
        }
      }
    });
  }, [lostItem.id, foundItem.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!answer.trim()) {
      setError('Please provide a specific detail or feature that proves you own this item.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await claimService.submitClaim(
        lostItem,
        foundItem,
        currentUserId,
        answer,
        selectedHub,
        matchId
      );
      setClaimResult({
        claim: res,
        verified: res.status === 'verified',
        message: 'Your verification answer has been securely submitted.',
      });
    } catch (err: any) {
      setError(err?.message || 'Verification could not be processed.');
    } finally {
      setLoading(false);
    }
  };

  const handleResolveAndComplete = async () => {
    try {
      // Mark as resolved
      await itemService.markResolved(
        lostItem.id,
        `Handover coordinated at ${selectedHub}`,
        currentUserId,
        true
      );
      await itemService.markResolved(
        foundItem.id,
        `Handover coordinated at ${selectedHub}`,
        foundItem.user_id,
        true
      );
      onSuccess();
    } catch (e) {
      console.error(e);
      onSuccess();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-xl bg-[#0c101d] rounded-3xl shadow-2xl border border-slate-800 overflow-hidden my-8 text-white">
        {/* Header */}
        <div className="bg-slate-950 text-white px-6 py-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Ownership Verification</h2>
              <p className="text-xs text-slate-400">
                Dr. RVR NRI University Safe Return Protocol
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800/80 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {!claimResult || !claimResult.verified ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 text-xs text-amber-200 leading-relaxed">
                <p className="font-bold mb-1 text-amber-300">To protect student privacy and prevent fraudulent claims:</p>
                <p>
                  Please answer a question about information not shown publicly in the photo or summary (e.g. unique scratches, stickers, internal contents, lock screen photo, brand serial, or specific keychain).
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  {lostItem.private_verification_question ||
                    foundItem.private_verification_question ||
                    'What unique feature, internal detail, or secret marker confirms your ownership?'}
                </label>
                <textarea
                  rows={3}
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="e.g., Inside pocket contains a blue RVR NRI library card, scratch near the top right, red silicone casing..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-sm resize-none"
                />
              </div>

              {error && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 text-xs font-bold text-white lovable-glow-btn rounded-xl transition-all shadow-md disabled:opacity-50 cursor-pointer"
                >
                  {loading ? 'Verifying...' : 'Submit Verification'}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-5 animate-fade-in">
              {/* 3D Animated Verification Shield */}
              <div className="bg-slate-950/80 border border-emerald-500/25 rounded-3xl p-4">
                <VerificationShield3D
                  verified={true}
                  title="Ownership Details Verified"
                  subtitle="Dr. RVR NRI University Safe Protocol · Physical roll & phone numbers remain shielded"
                />
              </div>

              {/* Safe Campus Hub Handover selection */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Campus Safe Return Checkpoint
                    </label>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Select an official university desk to collect this item:
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShow3dMap(!show3dMap)}
                    className="px-3 py-1.5 rounded-xl bg-slate-900 border border-indigo-500/30 text-indigo-300 hover:text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Compass className="w-3.5 h-3.5 text-indigo-400" />
                    <span>{show3dMap ? 'Hide Map' : 'NRI Campus Map'}</span>
                  </button>
                </div>

                {show3dMap && (
                  <div className="animate-fade-in my-3">
                    <NriCampusMap
                      selectedCheckpointId="library"
                      showReportsList={false}
                      onSelectCheckpoint={(name) => {
                        setSelectedHub(name);
                        if (claimResult?.claim?.id) {
                          claimService.updateExchangeLocation(claimResult.claim.id, name);
                        }
                      }}
                    />
                  </div>
                )}

                <div className="space-y-2">
                  {SAFE_CAMPUS_HUBS.map((hub) => (
                    <label
                      key={hub}
                      className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                        selectedHub === hub
                          ? 'border-indigo-500 bg-indigo-500/10 shadow-sm'
                          : 'border-slate-800 hover:border-slate-700 bg-slate-950/80'
                      }`}
                    >
                      <input
                        type="radio"
                        name="hub"
                        checked={selectedHub === hub}
                        onChange={() => {
                          setSelectedHub(hub);
                          if (claimResult?.claim?.id) {
                            claimService.updateExchangeLocation(claimResult.claim.id, hub);
                          }
                        }}
                        className="text-indigo-600 focus:ring-indigo-500"
                      />
                      <Building2 className="w-4 h-4 text-slate-400" />
                      <span className="text-xs font-semibold text-white">{hub}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 text-xs text-slate-300 space-y-1.5">
                <div className="font-semibold text-white">Next Steps:</div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
                  <span>Both students can present their university ID at {selectedHub}.</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
                  <span>The desk custodian will verify your physical student ID before item release.</span>
                </div>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full sm:w-auto px-4 py-2.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={handleResolveAndComplete}
                  className="w-full sm:w-auto px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Mark as Resolved & Returned</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
