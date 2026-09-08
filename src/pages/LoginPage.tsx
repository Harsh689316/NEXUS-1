import React, { useEffect, useState } from 'react';
import {
  Shield,
  Fingerprint,
  KeyRound,
  LockKeyhole,
  ArrowRight,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Eye,
  EyeOff,
  Usb,
  MapPinned,
  Mail,
  Clock3,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LoginPage: React.FC = () => {
  const {
    loginStep1,
    biometricStepPending,
    pendingOfficer,
    biometricState,
    hasWebAuthn,
    hasPasskey,
    startBiometricVerification,
    startRecoveryAuthentication,
    registerPasskey,
    requestRecovery,
    administratorBootstrap,
    recoveryRequestId,
    recoveryRequestStatus,
    resetBiometric,
  } = useAuth();

  const [officerId, setOfficerId] = useState('');
  const [password, setPassword] = useState('');
  const [recoveryCode, setRecoveryCode] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [showRecovery, setShowRecovery] = useState(false);
  const [showEnroll, setShowEnroll] = useState(false);
  const [showAdminRecovery, setShowAdminRecovery] = useState(false);

  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);

  /*
   * Keep the polled recovery status locally.
   *
   * This is important because AuthContext exposes
   * recoveryRequestStatus, but it does not expose a
   * setRecoveryRequestStatus function.
   */
  const [polledRecoveryStatus, setPolledRecoveryStatus] = useState(
    recoveryRequestStatus || ''
  );

  const apiBase = (import.meta.env.VITE_API_ORIGIN || '/api').replace(
    /\/$/,
    ''
  );

  /*
   * Keep local recovery status synchronized with AuthContext.
   */
  useEffect(() => {
    if (recoveryRequestStatus) {
      setPolledRecoveryStatus(recoveryRequestStatus);
    }
  }, [recoveryRequestStatus]);

  /*
   * Countdown timer.
   */
  useEffect(() => {
    if (!recoveryRequestId || !expiresAt) {
      setSecondsLeft(0);
      return;
    }

    const updateCountdown = () => {
      const remaining = Math.max(
        0,
        Math.ceil((expiresAt - Date.now()) / 1000)
      );

      setSecondsLeft(remaining);
    };

    updateCountdown();

    const timer = window.setInterval(updateCountdown, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, [recoveryRequestId, expiresAt]);

  /*
   * Poll recovery request status.
   */
  useEffect(() => {
    if (!recoveryRequestId) {
      return;
    }

    let cancelled = false;

    const pollRecoveryStatus = async () => {
      try {
        const response = await fetch(
          `${apiBase}/auth/recovery-status/${recoveryRequestId}`
        );

        if (!response.ok) {
          return;
        }

        const data = await response.json();

        if (cancelled) {
          return;
        }

        if (data.status) {
          setPolledRecoveryStatus(data.status);
        }

        if (data.expiresAt) {
          setExpiresAt(data.expiresAt);
        }
      } catch {
        /*
         * A temporary polling failure should not
         * destroy the login flow.
         */
      }
    };

    pollRecoveryStatus();

    const timer = window.setInterval(
      pollRecoveryStatus,
      2500
    );

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [recoveryRequestId, apiBase]);

  /*
   * Password authentication.
   */
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();

    setError('');
    setLoading(true);

    try {
      const result = await loginStep1(
        officerId.trim(),
        password
      );

      if (!result.success) {
        setError(
          result.error || 'Authentication failed.'
        );
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Authentication failed.'
      );
    } finally {
      setLoading(false);
    }
  };

  /*
   * WebAuthn / device authentication.
   */
  const deviceAuth = async () => {
    setError('');
    setLoading(true);

    try {
      await startBiometricVerification();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Device authentication failed.'
      );
    } finally {
      setLoading(false);
    }
  };

  /*
   * Create remote recovery request.
   */
  const createRequest = async (
    enrollment = false
  ) => {
    setError('');
    setLoading(true);

    try {
      const result = await requestRecovery();

      setExpiresAt(result.expiresAt);
      setPolledRecoveryStatus('PENDING');

      if (enrollment) {
        setShowEnroll(true);
        setShowRecovery(false);
      } else {
        setShowRecovery(true);
        setShowEnroll(false);
      }

      setShowAdminRecovery(false);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Recovery request failed.'
      );
    } finally {
      setLoading(false);
    }
  };

  /*
   * Administrator bootstrap recovery.
   */
  const adminRecovery = async () => {
    setError('');
    setLoading(true);

    try {
      await administratorBootstrap(
        recoveryCode.trim()
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Administrator recovery failed.'
      );
    } finally {
      setLoading(false);
    }
  };

  /*
   * Use approved one-time recovery code.
   */
  const recovery = async () => {
    setError('');
    setLoading(true);

    try {
      await startRecoveryAuthentication(
        recoveryCode.trim()
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Recovery authentication failed.'
      );
    } finally {
      setLoading(false);
    }
  };

  /*
   * Use approved recovery code to register
   * a new device/passkey.
   */
  const enroll = async () => {
    setError('');
    setLoading(true);

    try {
      await registerPasskey(
        recoveryCode.trim()
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Passkey enrollment failed.'
      );
    } finally {
      setLoading(false);
    }
  };

  /*
   * Return to device authentication.
   */
  const back = () => {
    setShowRecovery(false);
    setShowEnroll(false);
    setShowAdminRecovery(false);
    setRecoveryCode('');
    setError('');
    setPolledRecoveryStatus(
      recoveryRequestStatus || ''
    );
    resetBiometric();
  };

  const accessScope =
    pendingOfficer?.accessScope === 'area'
      ? `Local area • ${pendingOfficer?.jurisdictionArea || 'Assigned area'}`
      : pendingOfficer?.accessScope === 'city'
        ? `Whole city • ${pendingOfficer?.jurisdictionCity || 'Assigned city'}`
        : `Whole division • ${pendingOfficer?.jurisdictionDivision || 'Assigned division'}`;

  return (
    <div className="min-h-screen bg-[#050908] text-[#E8F5EC] relative overflow-hidden">
      {/* Background grid */}
      <div
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            'linear-gradient(rgba(55,255,133,.06) 1px, transparent 1px), linear-gradient(90deg, rgba(55,255,133,.06) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      <div className="relative z-10 min-h-screen grid lg:grid-cols-[1.1fr_.9fr]">
        {/* LEFT SIDE */}
        <section className="hidden lg:flex flex-col justify-between p-12 border-r border-[#183423]">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl border border-[#37ff85]/50 bg-[#0b1b11] flex items-center justify-center">
                <Shield className="w-6 h-6 text-[#37ff85]" />
              </div>

              <div>
                <div className="text-xl font-black tracking-[.28em]">
                  NEXUS
                </div>

                <div className="text-[10px] tracking-[.3em] text-[#6f8b79]">
                  INVESTIGATION INTELLIGENCE
                </div>
              </div>
            </div>

            <div className="mt-28 max-w-xl">
              <div className="text-[#37ff85] text-xs font-mono tracking-[.3em] mb-4">
                SECURE OPERATIONS CONSOLE
              </div>

              <h1 className="text-5xl font-black leading-[1.02] tracking-tight">
                Intelligence at the speed of{' '}
                <span className="text-[#37ff85]">
                  evidence.
                </span>
              </h1>

              <p className="mt-6 text-[#88a193] text-sm leading-7">
                Controlled investigation workspace with
                device-bound authentication,
                jurisdiction-aware access and
                tamper-evident audit controls.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="p-4 rounded-xl border border-[#183423] bg-[#08110c]/80">
              <div className="text-[10px] text-[#5e7868]">
                AUTH
              </div>

              <div className="mt-2 text-sm font-bold">
                WebAuthn
              </div>
            </div>

            <div className="p-4 rounded-xl border border-[#183423] bg-[#08110c]/80">
              <div className="text-[10px] text-[#5e7868]">
                RECOVERY
              </div>

              <div className="mt-2 text-sm font-bold">
                5 min / one use
              </div>
            </div>

            <div className="p-4 rounded-xl border border-[#183423] bg-[#08110c]/80">
              <div className="text-[10px] text-[#5e7868]">
                PORTS
              </div>

              <div className="mt-2 text-sm font-bold">
                3000 / 4000
              </div>
            </div>
          </div>
        </section>

        {/* RIGHT SIDE */}
        <section className="flex items-center justify-center p-6 sm:p-10">
          <div className="w-full max-w-md">

            {/* Mobile logo */}
            <div className="lg:hidden flex items-center gap-3 mb-10">
              <Shield className="w-7 h-7 text-[#37ff85]" />

              <div className="text-lg font-black tracking-[.25em]">
                NEXUS
              </div>
            </div>

            {/* Header */}
            <div className="mb-8">
              <div className="text-[10px] font-mono tracking-[.25em] text-[#37ff85]">
                AUTHORIZED PERSONNEL ONLY
              </div>

              <h2 className="mt-2 text-3xl font-black">
                Sign in to NEXUS
              </h2>

              <p className="mt-2 text-sm text-[#789081]">
                Your role and jurisdiction determine what
                intelligence you can access.
              </p>
            </div>

            {/* PASSWORD LOGIN */}
            {!biometricStepPending && (
              <form
                onSubmit={submit}
                className="space-y-5"
              >
                <div>
                  <label className="text-[11px] font-bold tracking-wider text-[#8fa798]">
                    OFFICER ID
                  </label>

                  <div className="mt-2 relative">
                    <KeyRound className="absolute left-3 top-3.5 w-4 h-4 text-[#4e6c59]" />

                    <input
                      value={officerId}
                      onChange={(event) =>
                        setOfficerId(event.target.value)
                      }
                      autoComplete="username"
                      className="w-full h-11 rounded-xl bg-[#08110c] border border-[#1d3827] pl-10 pr-3 text-sm outline-none focus:border-[#37ff85]"
                      placeholder="Enter officer ID"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold tracking-wider text-[#8fa798]">
                    PASSWORD
                  </label>

                  <div className="mt-2 relative">
                    <LockKeyhole className="absolute left-3 top-3.5 w-4 h-4 text-[#4e6c59]" />

                    <input
                      value={password}
                      onChange={(event) =>
                        setPassword(event.target.value)
                      }
                      type={
                        showPassword
                          ? 'text'
                          : 'password'
                      }
                      autoComplete="current-password"
                      className="w-full h-11 rounded-xl bg-[#08110c] border border-[#1d3827] pl-10 pr-10 text-sm outline-none focus:border-[#37ff85]"
                      placeholder="Enter password"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowPassword(
                          (value) => !value
                        )
                      }
                      className="absolute right-3 top-3.5 text-[#5c7666]"
                      aria-label={
                        showPassword
                          ? 'Hide password'
                          : 'Show password'
                      }
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="p-3 rounded-xl border border-red-500/30 bg-red-500/5 text-xs text-red-300 flex gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />

                    <span>{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={
                    loading ||
                    !officerId.trim() ||
                    !password
                  }
                  className="w-full h-12 rounded-xl bg-[#37ff85] text-[#041008] font-black text-sm flex items-center justify-center gap-2 disabled:opacity-40"
                >
                  {loading
                    ? 'VERIFYING CREDENTIALS'
                    : 'CONTINUE'}

                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}

            {/* SECOND AUTHENTICATION STEP */}
            {biometricStepPending && (
              <div className="space-y-4">

                {/* Officer card */}
                <div className="p-4 rounded-2xl border border-[#1d3827] bg-[#08110c]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#102417] border border-[#37ff85]/30 flex items-center justify-center text-[#37ff85] font-bold">
                      {pendingOfficer?.avatarInitials ||
                        '?'}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="font-bold truncate">
                        {pendingOfficer?.name ||
                          'Authorized Officer'}
                      </div>

                      <div className="text-[11px] text-[#6f8b79] truncate">
                        {pendingOfficer?.rank ||
                          'Officer'}{' '}
                        • {pendingOfficer?.id || officerId}
                      </div>
                    </div>

                    <MapPinned className="w-4 h-4 text-[#37ff85] shrink-0" />
                  </div>

                  <div className="mt-3 text-[11px] text-[#7e9788]">
                    Access scope:{' '}
                    <span className="text-[#d9e9df] font-semibold">
                      {accessScope}
                    </span>
                  </div>
                </div>

                {/* DEVICE AUTHENTICATION */}
                {!showRecovery &&
                  !showEnroll &&
                  !showAdminRecovery && (
                    <>
                      <div className="p-5 rounded-2xl border border-[#1d3827] bg-[#07100b] text-center">
                        <div
                          className={`mx-auto w-20 h-20 rounded-2xl border flex items-center justify-center ${
                            biometricState.status ===
                            'failed'
                              ? 'border-red-400 bg-red-400/10'
                              : 'border-[#2c563b] bg-[#0a160e]'
                          }`}
                        >
                          {biometricState.status ===
                          'matched' ? (
                            <CheckCircle2 className="w-10 h-10 text-[#37ff85]" />
                          ) : (
                            <Fingerprint className="w-10 h-10 text-[#37ff85]" />
                          )}
                        </div>

                        <div className="mt-4 font-bold text-sm">
                          {biometricState.status ===
                          'failed'
                            ? 'Device authentication unavailable'
                            : 'Use device authentication'}
                        </div>

                        <p className="mt-1 text-[11px] text-[#718b7c]">
                          {hasWebAuthn
                            ? 'Use a registered passkey, Windows Hello, PIN or security key.'
                            : 'This device does not expose WebAuthn.'}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={deviceAuth}
                        disabled={
                          loading ||
                          !hasWebAuthn ||
                          !hasPasskey
                        }
                        className="w-full h-12 rounded-xl bg-[#37ff85] text-[#041008] font-black text-sm flex items-center justify-center gap-2 disabled:opacity-40"
                      >
                        {loading
                          ? 'AUTHENTICATING…'
                          : 'AUTHENTICATE WITH DEVICE'}

                        <Fingerprint className="w-4 h-4" />
                      </button>

                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            createRequest(false)
                          }
                          disabled={loading}
                          className="h-11 rounded-xl border border-[#24432e] text-xs font-bold text-[#b6c8bc] hover:bg-white/5 flex items-center justify-center gap-2"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          Request recovery
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            createRequest(true)
                          }
                          disabled={loading}
                          className="h-11 rounded-xl border border-[#24432e] text-xs font-bold text-[#b6c8bc] hover:bg-white/5 flex items-center justify-center gap-2"
                        >
                          <Usb className="w-3.5 h-3.5" />
                          Register device
                        </button>
                      </div>

                      {pendingOfficer?.role ===
                        'system_admin' && (
                        <button
                          type="button"
                          onClick={() => {
                            setShowAdminRecovery(
                              true
                            );
                            setError('');
                          }}
                          disabled={loading}
                          className="w-full h-10 rounded-xl border border-[#37ff85]/30 text-xs font-bold text-[#37ff85] hover:bg-[#37ff85]/5"
                        >
                          Use Security Administrator
                          bootstrap recovery
                        </button>
                      )}

                      {!hasPasskey && (
                        <div className="text-center text-[10px] text-[#6e8b78]">
                          No registered passkey. Request
                          administrator approval to recover
                          or register this device.
                        </div>
                      )}
                    </>
                  )}

                {/* ADMINISTRATOR RECOVERY */}
                {showAdminRecovery && (
                  <div className="p-5 rounded-2xl border border-[#1d3827] bg-[#08110c] space-y-4">
                    <div className="flex items-center gap-2 text-sm font-bold">
                      <Shield className="w-4 h-4 text-[#37ff85]" />
                      Security Administrator Recovery
                    </div>

                    <p className="text-[11px] leading-5 text-[#8aa093]">
                      Local bootstrap recovery for the
                      isolated NEXUS Security Administrator.
                      Production deployments should use the
                      administrator&apos;s managed passkey
                      or an approved out-of-band recovery
                      process.
                    </p>

                    <input
                      value={recoveryCode}
                      onChange={(event) =>
                        setRecoveryCode(
                          event.target.value
                        )
                      }
                      className="w-full h-11 rounded-xl bg-[#050908] border border-[#24432e] px-3 text-sm font-mono outline-none focus:border-[#37ff85]"
                      placeholder="Enter administrator recovery code"
                      autoComplete="one-time-code"
                    />

                    {error && (
                      <div className="p-3 rounded-xl border border-red-500/30 bg-red-500/5 text-xs text-red-300 flex gap-2">
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                        <span>{error}</span>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={adminRecovery}
                      disabled={
                        loading ||
                        !recoveryCode.trim()
                      }
                      className="w-full h-11 rounded-xl bg-[#37ff85] text-[#041008] font-black text-xs disabled:opacity-40"
                    >
                      {loading
                        ? 'VERIFYING…'
                        : 'VERIFY ADMINISTRATOR RECOVERY'}
                    </button>

                    <button
                      type="button"
                      onClick={back}
                      className="w-full text-[11px] text-[#718b7c]"
                    >
                      Back to device authentication
                    </button>
                  </div>
                )}

                {/* REMOTE RECOVERY / DEVICE REGISTRATION */}
                {(showRecovery || showEnroll) &&
                  !showAdminRecovery && (
                    <div className="p-5 rounded-2xl border border-[#1d3827] bg-[#08110c] space-y-4">

                      <div className="flex items-center gap-2 text-sm font-bold">
                        {showEnroll ? (
                          <Usb className="w-4 h-4 text-[#37ff85]" />
                        ) : (
                          <Mail className="w-4 h-4 text-[#37ff85]" />
                        )}

                        {showEnroll
                          ? 'Register secure device'
                          : 'Remote recovery'}
                      </div>

                      {!recoveryRequestId ? (
                        <button
                          type="button"
                          onClick={() =>
                            createRequest(
                              showEnroll
                            )
                          }
                          disabled={loading}
                          className="w-full h-11 rounded-xl bg-[#37ff85] text-[#041008] font-black text-xs disabled:opacity-40"
                        >
                          {loading
                            ? 'CREATING REQUEST…'
                            : 'REQUEST ONE-TIME CODE'}
                        </button>
                      ) : (
                        <>
                          <div className="p-3 rounded-xl border border-[#24432e] bg-[#07100b]">
                            <div className="text-[10px] uppercase tracking-wider text-[#668171]">
                              Recovery request
                            </div>

                            <div className="mt-1 font-mono text-xs break-all">
                              {recoveryRequestId}
                            </div>

                            <div className="mt-2 flex items-center gap-2 text-[11px] text-[#9ab2a1] flex-wrap">
                              <Clock3 className="w-3.5 h-3.5" />

                              <span>Status:</span>

                              <b
                                className={
                                  polledRecoveryStatus ===
                                  'APPROVED'
                                    ? 'text-[#37ff85]'
                                    : polledRecoveryStatus ===
                                        'DENIED'
                                      ? 'text-red-400'
                                      : 'text-yellow-300'
                                }
                              >
                                {polledRecoveryStatus ||
                                  'PENDING'}
                              </b>

                              {secondsLeft > 0 && (
                                <span>
                                  • {secondsLeft}s
                                  remaining
                                </span>
                              )}
                            </div>
                          </div>

                          <p className="text-[11px] leading-5 text-[#8aa093]">
                            Your request must be approved by
                            NEXUS Security Operations. After
                            approval, the one-time code is
                            delivered to the officer&apos;s
                            verified recovery email. The code
                            expires in 5 minutes and can be
                            used once.
                          </p>

                          {polledRecoveryStatus ===
                            'DENIED' && (
                            <div className="p-3 rounded-xl border border-red-500/30 bg-red-500/5 text-xs text-red-300">
                              The recovery request was
                              denied. Start a new request if
                              recovery is still required.
                            </div>
                          )}

                          {error && (
                            <div className="p-3 rounded-xl border border-red-500/30 bg-red-500/5 text-xs text-red-300 flex gap-2">
                              <AlertTriangle className="w-4 h-4 shrink-0" />
                              <span>{error}</span>
                            </div>
                          )}

                          <input
                            value={recoveryCode}
                            onChange={(event) =>
                              setRecoveryCode(
                                event.target.value
                              )
                            }
                            className="w-full h-11 rounded-xl bg-[#050908] border border-[#24432e] px-3 text-sm font-mono outline-none focus:border-[#37ff85]"
                            placeholder="Enter one-time authorization code"
                            autoComplete="one-time-code"
                            inputMode="numeric"
                          />

                          <button
                            type="button"
                            onClick={
                              showEnroll
                                ? enroll
                                : recovery
                            }
                            disabled={
                              loading ||
                              !recoveryCode.trim() ||
                              polledRecoveryStatus !==
                                'APPROVED'
                            }
                            className="w-full h-11 rounded-xl bg-[#37ff85] text-[#041008] font-black text-xs disabled:opacity-40"
                          >
                            {loading
                              ? 'VERIFYING…'
                              : showEnroll
                                ? 'VERIFY & REGISTER DEVICE'
                                : 'VERIFY ONE-TIME CODE'}
                          </button>
                        </>
                      )}

                      <button
                        type="button"
                        onClick={back}
                        className="w-full text-[11px] text-[#718b7c]"
                      >
                        Back to device authentication
                      </button>
                    </div>
                  )}

                {/* Error when on device screen */}
                {error &&
                  !showRecovery &&
                  !showEnroll &&
                  !showAdminRecovery && (
                    <div className="p-3 rounded-xl border border-red-500/30 bg-red-500/5 text-xs text-red-300 flex gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                <button
                  type="button"
                  onClick={() =>
                    window.location.reload()
                  }
                  className="w-full text-[11px] text-[#597565]"
                >
                  Start over
                </button>
              </div>
            )}

            {/* Footer */}
            <div className="mt-8 pt-5 border-t border-[#14291c] flex items-center justify-between text-[10px] font-mono text-[#4e6858]">
              <span>AUTH API :4000</span>
              <span>UI :3000</span>
              <span>SESSION • 30 MIN</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};