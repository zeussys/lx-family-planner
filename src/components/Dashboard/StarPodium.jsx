import { useState } from 'react';
import { Minus, Plus, Star, Trophy } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useFamily } from '../../context/FamilyContext';
import { plannerApiRequest } from '../../utils/apiConfig.js';
import { useStarPodium } from '../../hooks/useStarPodium.js';
import { DEFAULT_MEMBER_AVATAR, handleImgError } from '../../utils/imageFallback';

const MEDALS = ['🥇', '🥈', '🥉'];
const STEP = 1;

// Podium der letzten 30 Tage. Eltern koennen Sterne direkt hier anpassen.
export default function StarPodium({ variant = 'default', limit = 0 }) {
  const { t } = useTranslation('dashboard');
  const { members, activeMember, refreshBootstrap, showToast } = useFamily();
  const { entries, isLoading, error, reload } = useStarPodium({ members });
  const [busyId, setBusyId] = useState('');
  const canAdjust = activeMember?.role === 'adult';
  const visible = limit ? entries.slice(0, limit) : entries;

  const adjust = async (memberId, delta) => {
    setBusyId(memberId);
    try {
      await plannerApiRequest('/api/stars/adjust', {
        method: 'POST',
        body: JSON.stringify({
          memberId,
          delta,
          reason: t('starPodium.adjustReason')
        })
      });
      await Promise.all([reload(), refreshBootstrap({ silent: true })]);
    } catch (requestError) {
      showToast?.(requestError?.message || t('starPodium.adjustFailed'));
    } finally {
      setBusyId('');
    }
  };

  if (isLoading) {
    return <p className="star-podium-hint">{t('starPodium.loading')}</p>;
  }
  if (error) {
    return <p className="star-podium-hint">{t('starPodium.error')}</p>;
  }
  if (!visible.length) {
    return <p className="star-podium-hint">{t('starPodium.empty')}</p>;
  }

  return (
    <div className={`star-podium star-podium-${variant}`}>
      <ol className="star-podium-list">
        {visible.map((entry, index) => (
          <li
            key={entry.memberId}
            className={index < 3 && entry.stars ? 'is-podium' : ''}
            style={{ '--member-color': entry.color || '#377d69' }}
          >
            <span className="star-podium-rank" aria-hidden="true">
              {entry.stars ? MEDALS[entry.rank - 1] || entry.rank : '·'}
            </span>
            <img
              alt=""
              className="star-podium-avatar"
              src={entry.avatar || DEFAULT_MEMBER_AVATAR}
              onError={event => handleImgError(event, DEFAULT_MEMBER_AVATAR)}
            />
            <span className="star-podium-name">{entry.name}</span>
            {canAdjust && (
              <span className="star-podium-actions">
                <button
                  type="button"
                  aria-label={t('starPodium.minus', { name: entry.name })}
                  disabled={busyId === entry.memberId || !entry.stars}
                  onClick={() => adjust(entry.memberId, -STEP)}
                >
                  <Minus size={16} />
                </button>
                <button
                  type="button"
                  aria-label={t('starPodium.plus', { name: entry.name })}
                  disabled={busyId === entry.memberId}
                  onClick={() => adjust(entry.memberId, STEP)}
                >
                  <Plus size={16} />
                </button>
              </span>
            )}
            <span className="star-podium-score">
              <Star aria-hidden="true" size={variant === 'wall' ? 22 : 16} />
              {entry.stars}
            </span>
          </li>
        ))}
      </ol>
      <p className="star-podium-footnote">
        <Trophy aria-hidden="true" size={14} />
        {t('starPodium.totals')}
      </p>
    </div>
  );
}
