/* 発表用デモ:右上の「DEMO」ボタンで使う操作 */
document.getElementById('demoMenu').addEventListener('click', async () => {
  const choice = await ask('デモの操作', '架空の北大生を相手に、本番と同じ画面で操作できます。相手は自動で返事をします。', [
    { label: '閉じる', value: '' },
    { label: '最初に戻す', value: 'reset' },
    { label: '相手から誘いが届く', value: 'incoming', style: 'btn-primary' },
  ]);
  if (choice === 'reset') location.reload();
  if (choice === 'incoming') {
    if (window.demoIncomingInvite()) {
      showTab('party');
      setTimeout(() => toast('新しいごはんの誘いが届きました'), 400);
    } else {
      toast('誘ってくれる相手がもういません。「最初に戻す」を押してください');
    }
  }
});
