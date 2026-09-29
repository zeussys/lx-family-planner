import { useCallback, useEffect, useMemo, useState } from 'react';
import { RotateCcw, Star } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useFamily } from '../../context/FamilyContext';
import { plannerApiRequest } from '../../utils/apiConfig.js';
import { formatDate } from '../../utils/formatting';

const PRESETS = [
  { key: 'helped', delta: 5 },
  { key: 'helpedSibling', delta: 5 },
  { key: 'askedTwice', delta: -2 },
  { key: 'behaviour', delta: -5 }
];

const SOURCE_KEYS = {
  task: 'source.task',
  reward: 'source.reward',
  pocketMoney: 'source.pocketMoney',
  adjustment: 'source.adjustment',
  reset: 'source.reset'
};

// Sterne von Hand gutschreiben oder abziehen – mit Grund und Verlauf.
export default function StarAdjustments() {
  const { t } = useTranslation('admin');
  const { members, refreshBootstrap, showToast } = useFamily();
  const candidates = useMemo(
    () => members.filter(member => member.role !== 'pet'),
    [members]
  );
  const [memberId, setMemberId] = useState('');
  const [amount, setAmount] = useState('5');
  const [reason, setReason] = useState('');
  const [events, setEvents] = useState([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!memberId && candidates.length) setMemberId(candidates[0].id);
  }, [candidates, memberId]);

  const loadHistory = useCallback(async () => {
    try {
      const data = await plannerApiRequest('/api/stars/events?limit=25');
      setEvents(Array.isArray(data?.events) ? data.events : []);
    } catch {
      setEvents([]);
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const memberName = id =>
    members.find(member => member.id === id)?.name || t('starAdjust.unknown');

  const submit = async (delta, presetReason = '') => {
    const value = Math.trunc(Number(delta) || 0);
    if (!memberId || !value) return;
    setBusy(true);
    try {
      const result = await plannerApiRequest('/api/stars/adjust', {
        method: 'POST',
        body: JSON.stringify({
          memberId,
          delta: value,
          reason: presetReason || reason
        })
      });
      showToast?.(
        t('starAdjust.saved', {
          name: memberName(memberId),
          stars: result?.member?.stars ?? 0
        })
      );
      setReason('');
      await Promise.all([loadHistory(), refreshBootstrap({ silent: true })]);
    } catch (error) {
      showToast?.(error?.message || t('starAdjust.failed'));
    } finally {
      setBusy(false);
    }
  };

  const revert = async eventId => {
    setBusy(true);
    try {
      await plannerApiRequest(`/api/stars/events/${eventId}/revert`, {
        method: 'POST'
      });
      showToast?.(t('starAdjust.reverted'));
      await Promise.all([loadHistory(), refreshBootstrap({ silent: true })]);
    } catch (error) {
      showToast?.(error?.message || t('starAdjust.failed'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="card admin-panel star-adjust-panel">
      <header>
        <h2><Star size={18} /> {t('starAdjust.title')}</h2>
      </header>
      <p className="admin-panel-intro">{t('starAdjust.intro')}</p>

      <div className="star-adjust-form">
        <label>
          <span>{t('starAdjust.member')}</span>
          <select
            value={memberId}
            onChange={event => setMemberId(event.target.value)}
          >
            {candidates.map(member => (
              <option key={member.id} value={member.id}>
                {member.name} ({member.stars || 0} ★)
              </option>
            ))}
          </select>
        </label>

        <div className="star-adjust-presets">
          {PRESETS.map(preset => (
            <button
              key={preset.key}
              type="button"
              disabled={busy || !memberId}
              className={preset.delta > 0 ? 'is-positive' : 'is-negative'}
              onClick={() =>
                submit(preset.delta, t(`starAdjust.presets.${preset.key}`))
              }
            >
              {preset.delta > 0 ? `+${preset.delta}` : preset.delta}
              <small>{t(`starAdjust.presets.${preset.key}`)}</small>
            </button>
          ))}
        </div>

        <div className="star-adjust-custom">
          <label>
            <span>{t('starAdjust.amount')}</span>
            <input
              type="number"
              min="-1000"
              max="1000"
              value={amount}
              onChange={event => setAmount(event.target.value)}
            />
          </label>
          <label>
            <span>{t('starAdjust.reason')}</span>
            <input
              type="text"
              maxLength={200}
              value={reason}
              placeholder={t('starAdjust.reasonPlaceholder')}
              onChange={event => setReason(event.target.value)}
            />
          </label>
          <button
            type="button"
            disabled={busy || !memberId || !Number(amount)}
            onClick={() => submit(amount)}
          >
            {t('starAdjust.book')}
          </button>
        </div>
      </div>

      <h3 className="star-adjust-history-title">{t('starAdjust.history')}</h3>
      {events.length === 0 ? (
        <p className="admin-panel-intro">{t('starAdjust.historyEmpty')}</p>
      ) : (
        <ul className="star-adjust-history">
          {events.map(event => (
            <li key={event.id} className={event.revertedAt ? 'is-reverted' : ''}>
              <b className={event.delta > 0 ? 'is-positive' : 'is-negative'}>
                {event.delta > 0 ? `+${event.delta}` : event.delta}
              </b>
              <span>
                <strong>{memberName(event.memberId)}</strong>
                <small>
                  {event.reason || t(SOURCE_KEYS[event.source] || 'source.adjustment', {
                    ns: 'admin',
                    defaultValue: event.source
                  })}
                  {' · '}
                  {formatDate(new Date(event.createdAt))}
                  {event.actorId ? ` · ${memberName(event.actorId)}` : ''}
                </small>
              </span>
              {event.source === 'adjustment' && !event.revertedAt && (
                <button type="button" disabled={busy} onClick={() => revert(event.id)}>
                  <RotateCcw size={14} />
                  {t('starAdjust.revert')}
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
