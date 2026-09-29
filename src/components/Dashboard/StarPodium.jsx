import { Star, Trophy } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useFamily } from '../../context/FamilyContext';
import { STAR_PODIUM_DAYS, useStarPodium } from '../../hooks/useStarPodium.js';
import { DEFAULT_MEMBER_AVATAR, handleImgError } from '../../utils/imageFallback';

const MEDALS = ['🥇', '🥈', '🥉'];

// Podium der letzten 30 Tage – bewusst ohne "letzter Platz"-Kennzeichnung.
export default function StarPodium({ variant = 'default', limit = 0 }) {
  const { t } = useTranslation('dashboard');
  const { members } = useFamily();
  const { entries, isLoading, error } = useStarPodium({ members });
  const visible = limit ? entries.slice(0, limit) : entries;
  const leader = visible[0];

  if (isLoading) {
    return <p className="star-podium-hint">{t('starPodium.loading')}</p>;
  }
  if (error) {
    return <p className="star-podium-hint">{t('starPodium.error')}</p>;
  }
  if (!visible.length || !leader?.earned) {
    return <p className="star-podium-hint">{t('starPodium.empty')}</p>;
  }

  return (
    <div className={`star-podium star-podium-${variant}`}>
      <ol className="star-podium-list">
        {visible.map((entry, index) => (
          <li
            key={entry.memberId}
            className={index < 3 ? 'is-podium' : ''}
            style={{ '--member-color': entry.color || '#377d69' }}
          >
            <span className="star-podium-rank" aria-hidden="true">
              {MEDALS[entry.rank - 1] || entry.rank}
            </span>
            <img
              alt=""
              className="star-podium-avatar"
              src={entry.avatar || DEFAULT_MEMBER_AVATAR}
              onError={handleImgError(DEFAULT_MEMBER_AVATAR)}
            />
            <span className="star-podium-name">{entry.name}</span>
            <span className="star-podium-score">
              <Star aria-hidden="true" size={variant === 'wall' ? 22 : 16} />
              {entry.earned}
            </span>
          </li>
        ))}
      </ol>
      <p className="star-podium-footnote">
        <Trophy aria-hidden="true" size={14} />
        {t('starPodium.period', { days: STAR_PODIUM_DAYS })}
      </p>
    </div>
  );
}
