// ===== SPACED REPETITION (SM-2 simplified) =====
const SR = {
  // rating: 1=Hard, 3=OK, 5=Easy
  getDefaultCard(cardId) {
    return {
      cardId,
      interval: 0,      // days until next review
      repetitions: 0,   // times reviewed successfully
      easeFactor: 2.5,  // difficulty multiplier
      nextReview: 0,    // timestamp
      status: 'new'     // new | learning | mastered
    };
  },

  update(cardData, rating) {
    let { interval, repetitions, easeFactor } = cardData;
    // Giữ lại status cũ để không bao giờ tụt xuống 'new'
    const prevStatus = cardData.status || 'new';

    if (rating < 3) {
      // Failed — reset repetitions nhưng GIỮ interval ngắn để ôn lại sớm
      repetitions = 0;
      interval = 1;
    } else {
      if (repetitions === 0) interval = 1;
      else if (repetitions === 1) interval = 3;
      else interval = Math.round(interval * easeFactor);

      repetitions++;
      easeFactor = Math.max(1.3, easeFactor + 0.1 - (5 - rating) * (0.08 + (5 - rating) * 0.02));
    }

    // nextReview = 0h00 (local time) của ngày sau interval ngày
    const tomorrow = new Date();
    tomorrow.setHours(0, 0, 0, 0);                    // reset về 0h hôm nay
    tomorrow.setDate(tomorrow.getDate() + interval);   // cộng thêm interval ngày
    const nextReview = tomorrow.getTime();

    // Status chỉ tăng, không bao giờ tụt xuống 'new' sau khi đã học
    let status = 'new';
    if (repetitions >= 1) status = 'learning';
    if (repetitions >= 2 && rating >= 3) status = 'mastered';
    // Nếu đang là learning/mastered mà trả lời sai → giữ ít nhất 'learning'
    if (prevStatus === 'learning' && status === 'new') status = 'learning';
    if (prevStatus === 'mastered' && status !== 'mastered') status = 'learning';

    return { ...cardData, interval, repetitions, easeFactor, nextReview, status };
  },

  isDue(cardData) {
    if (!cardData || cardData.status === 'new') return true;
    return Date.now() >= cardData.nextReview;
  },

  getDueCards(cards, progress) {
    return cards.filter(c => {
      const p = progress[c.id];
      return this.isDue(p);
    });
  },

  getStatus(cardId, progress) {
    const p = progress[cardId];
    if (!p) return 'new';
    return p.status || 'new';
  },

  getDaysUntilReview(cardData) {
    if (!cardData || cardData.status === 'new') return 0;
    const diff = cardData.nextReview - Date.now();
    return Math.max(0, Math.ceil(diff / 86400000));
  }
};