import { useMemo } from 'react';
import { DeckelUIState, DECKEL_STATUS } from '../../domain/models';

export const useDeckelComputed = (
  selectedDeckel: DeckelUIState | null,
  isAbendGeschlossen: boolean
) => {
  const transactions = useMemo(() => selectedDeckel?.transactions ?? [], [selectedDeckel]);

  const totalCount = useMemo(
    () => transactions.reduce((acc, t) => acc + (t.count ?? 0), 0),
    [transactions]
  );

  const totalSum = useMemo(
    () => transactions.reduce((acc, t) => acc + (t.sum ?? 0), 0),
    [transactions]
  );

  const isSelectedPresent = !!selectedDeckel;

  const isReadOnly =
    isAbendGeschlossen ||
    selectedDeckel?.status === DECKEL_STATUS.GESCHLOSSEN ||
    selectedDeckel?.status === DECKEL_STATUS.BEZAHLT ||
    selectedDeckel?.status === DECKEL_STATUS.GONE;

  const hasTransactions = transactions.length > 0;

  const darfKorrigieren =
    !isAbendGeschlossen && !!selectedDeckel && (selectedDeckel.transactions?.length ?? 0) > 0;

  const darfDeckelGezahltWerden =
    !isAbendGeschlossen &&
    selectedDeckel?.status === DECKEL_STATUS.OFFEN &&
    hasTransactions &&
    totalSum <= 0;

  return {
    selectedDeckel,
    isSelectedPresent,
    isReadOnly,
    hasTransactions,
    darfDeckelGezahltWerden,
    totalCount,
    totalSum,
    darfKorrigieren,
  };
};
