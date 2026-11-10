/**
 * Pulaar Cardiac Anatomy Interactive Quiz & Study Engine (Laawol Jaŋde e Jarribo)
 * Enables users to practice and test their knowledge of cardiac anatomy in Pulaar.
 */

export class PulaarHeartQuiz {
  constructor(annotationStore, heartScene) {
    this.store = annotationStore;
    this.scene = heartScene;

    this.isActive = false;
    this.currentQuestion = null;
    this.lastTargetId = null;
    this.score = 0;
    this.totalAnswered = 0;
    this.streak = 0;
    this.bestStreak = 0;

    this.onStateChange = null;
  }

  start() {
    this.isActive = true;
    this.score = 0;
    this.totalAnswered = 0;
    this.streak = 0;
    this.lastTargetId = null;
    this.nextQuestion();
  }

  stop() {
    this.isActive = false;
    this.currentQuestion = null;
    this.lastTargetId = null;
    if (this.onStateChange) {
      this.onStateChange({
        isActive: false,
        score: this.score,
        total: this.totalAnswered
      });
    }
  }

  nextQuestion() {
    const all = this.store.getAll();
    if (all.length < 4) {
      alert("A ina sokli ko famɗi fof taƴe 4 ngam fuɗɗaade jarribo ngoo.");
      this.stop();
      return;
    }

    // Pick random target avoiding immediate repeat if multiple options exist
    let available = all;
    if (all.length > 1 && this.lastTargetId) {
      available = all.filter(a => a.id !== this.lastTargetId);
      if (available.length === 0) available = all;
    }
    const targetIdx = Math.floor(Math.random() * available.length);
    const target = available[targetIdx];
    this.lastTargetId = target.id;

    // Pick 3 distractors
    const others = all.filter(a => a.id !== target.id);
    this.shuffle(others);
    const distractors = others.slice(0, 3);

    const options = [target, ...distractors];
    this.shuffle(options);

    // Question type: 50% name recognition, 50% functional description
    const isFunctionQuestion = Math.random() > 0.5 && target.description_pulaar;

    this.currentQuestion = {
      target,
      options,
      isFunctionQuestion,
      prompt: isFunctionQuestion
        ? `Hol taƴre gollirnde nii: "${target.description_pulaar.slice(0, 110)}..."?`
        : `Hol ko woni innde ndee taƴre ɓernde?`,
      answered: false,
      userAnswer: null,
      isCorrect: null
    };

    // Fly camera to target to visually highlight it in 3D
    this.scene.flyTo(target.position, 2.6);
    this.scene.updatePins(all, target.id);

    if (this.onStateChange) {
      this.onStateChange({
        isActive: true,
        question: this.currentQuestion,
        score: this.score,
        total: this.totalAnswered,
        streak: this.streak
      });
    }
  }

  submitAnswer(selectedId) {
    if (!this.isActive || !this.currentQuestion || this.currentQuestion.answered) return;

    this.currentQuestion.answered = true;
    this.currentQuestion.userAnswer = selectedId;
    const isCorrect = selectedId === this.currentQuestion.target.id;
    this.currentQuestion.isCorrect = isCorrect;

    this.totalAnswered++;
    if (isCorrect) {
      this.score++;
      this.streak++;
      if (this.streak > this.bestStreak) this.bestStreak = this.streak;
    } else {
      this.streak = 0;
    }

    // Pulaar feedback phrases
    const successPhrases = [
      "Ko ɗum! A jaaraama! 🎉",
      "Moƴƴi sanne! 👏",
      "Kumpa maa e ɓernde ina yaaji! 🌟",
      "Golle moƴƴe! A heɓii ɗum! 💡"
    ];

    const errorPhrases = [
      "Kettino! Wonaa ɗum. 🧐",
      "Rutto jaŋngu taƴre ndee no moƴƴi. 📚",
      "Ɗum ko: " + this.currentQuestion.target.title_pulaar,
      "Hoto heppan, a heɓat e garoowo oo!"
    ];

    const feedback = isCorrect
      ? successPhrases[Math.floor(Math.random() * successPhrases.length)]
      : errorPhrases[Math.floor(Math.random() * errorPhrases.length)];

    if (this.onStateChange) {
      this.onStateChange({
        isActive: true,
        question: this.currentQuestion,
        score: this.score,
        total: this.totalAnswered,
        streak: this.streak,
        feedback,
        isCorrect
      });
    }
  }

  shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }
}
