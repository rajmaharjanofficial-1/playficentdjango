
from django.db import models
from django.contrib.auth.models import User


class UserProfile(models.Model):
    ROLE_CHOICES = [
        ('user', 'User'),
        ('admin', 'Admin'),
    ]

    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='profile'
    )

    role = models.CharField(
        max_length=10,
        choices=ROLE_CHOICES,
        default='user'
    )

    bio = models.TextField(blank=True, default='')
    avatar_url = models.TextField(blank=True, default='')

    # RPG SYSTEM

    level = models.IntegerField(default=1)
    xp = models.IntegerField(default=0)
    coins = models.IntegerField(default=0)

    # GAME STATS

    total_games = models.IntegerField(default=0)
    total_score = models.IntegerField(default=0)

    best_score = models.IntegerField(default=0)
    best_wpm = models.FloatField(default=0)

    total_words_typed = models.IntegerField(default=0)

    average_accuracy = models.FloatField(default=0)

    # STREAKS

    current_streak = models.IntegerField(default=0)
    longest_streak = models.IntegerField(default=0)

    # RANK

    rank_points = models.IntegerField(default=0)

    # COSMETICS

    selected_title = models.CharField(
        max_length=100,
        blank=True,
        default=''
    )

    selected_frame = models.CharField(
        max_length=50,
        blank=True,
        default='default'
    )

    last_played = models.DateTimeField(
        null=True,
        blank=True
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    updated_at = models.DateTimeField(
        auto_now=True
    )

    def __str__(self):
        return self.user.username

    class Meta:
        ordering = ['-total_score']


class Leaderboard(models.Model):

    DIFFICULTY_CHOICES = [
        ('easy', 'Easy'),
        ('normal', 'Normal'),
        ('hard', 'Hard'),
        ('insane', 'Insane'),
    ]

    MODE_CHOICES = [
        ('classic', 'Classic'),
        ('survival', 'Survival'),
        ('time_attack', 'Time Attack'),
        ('quote', 'Quote'),
    ]

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='leaderboard_scores',
        null=True
    )

    username = models.CharField(
        max_length=150
    )

    score = models.IntegerField(default=0)

    wpm = models.FloatField(default=0)

    accuracy = models.FloatField(default=0)

    combo = models.IntegerField(default=0)

    difficulty = models.CharField(
        max_length=10,
        choices=DIFFICULTY_CHOICES,
        default='normal'
    )

    mode = models.CharField(
        max_length=20,
        choices=MODE_CHOICES,
        default='classic'
    )

    timestamp = models.DateTimeField(
        auto_now_add=True
    )

    def __str__(self):
        return f"{self.username} - {self.score}"

    class Meta:
        ordering = ['-score', '-timestamp']


class GameSession(models.Model):

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='game_sessions',
        null=True
    )

    username = models.CharField(
        max_length=150
    )

    difficulty = models.CharField(
        max_length=20
    )

    mode = models.CharField(
        max_length=20,
        default='classic'
    )

    score = models.IntegerField()

    wpm = models.FloatField()

    accuracy = models.FloatField(default=0)

    combo = models.IntegerField(default=0)

    duration = models.IntegerField()

    words_typed = models.IntegerField(default=0)

    xp_earned = models.IntegerField(default=0)

    coins_earned = models.IntegerField(default=0)

    timestamp = models.DateTimeField(
        auto_now_add=True
    )

    def __str__(self):
        return f"{self.username} Session {self.id}"

    class Meta:
        ordering = ['-timestamp']


class Achievement(models.Model):

    TIER_CHOICES = [
        ('bronze', 'Bronze'),
        ('silver', 'Silver'),
        ('gold', 'Gold'),
        ('platinum', 'Platinum'),
    ]

    name = models.CharField(
        max_length=100,
        unique=True
    )

    description = models.TextField()

    icon = models.CharField(max_length=50)

    tier = models.CharField(
        max_length=10,
        choices=TIER_CHOICES,
        default='bronze'
    )

    condition = models.CharField(
        max_length=50
    )

    requirement = models.IntegerField()

    xp_reward = models.IntegerField(default=50)

    coin_reward = models.IntegerField(default=25)

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    def __str__(self):
        return self.name


class UserAchievement(models.Model):

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='achievements'
    )

    achievement = models.ForeignKey(
        Achievement,
        on_delete=models.CASCADE
    )

    unlocked_at = models.DateTimeField(
        auto_now_add=True
    )

    class Meta:
        unique_together = (
            'user',
            'achievement'
        )


class DailyQuest(models.Model):

    QUEST_TYPES = [
        ('play_games', 'Play Games'),
        ('reach_wpm', 'Reach WPM'),
        ('score_points', 'Score Points'),
        ('accuracy', 'Accuracy'),
    ]

    title = models.CharField(max_length=100)

    description = models.TextField()

    quest_type = models.CharField(
        max_length=50,
        choices=QUEST_TYPES
    )

    target = models.IntegerField()

    reward_xp = models.IntegerField(default=100)

    reward_coins = models.IntegerField(default=50)

    active_date = models.DateField()

    def __str__(self):
        return self.title


class UserQuest(models.Model):

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE
    )

    quest = models.ForeignKey(
        DailyQuest,
        on_delete=models.CASCADE
    )

    progress = models.IntegerField(default=0)

    completed = models.BooleanField(default=False)

    completed_at = models.DateTimeField(
        null=True,
        blank=True
    )


class Title(models.Model):

    name = models.CharField(
        max_length=100
    )

    description = models.TextField()

    color = models.CharField(
        max_length=20,
        default='green'
    )

    unlock_level = models.IntegerField(default=1)

    def __str__(self):
        return self.name


class Frame(models.Model):

    name = models.CharField(
        max_length=100
    )

    rarity = models.CharField(
        max_length=20
    )

    image = models.TextField(blank=True)

    def __str__(self):
        return self.name


class Season(models.Model):

    name = models.CharField(
        max_length=100
    )

    start_date = models.DateTimeField()

    end_date = models.DateTimeField()

    active = models.BooleanField(
        default=False
    )

    def __str__(self):
        return self.name


class Friend(models.Model):

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='friends'
    )

    friend = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='friend_of'
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )


class ShopItem(models.Model):

    ITEM_TYPES = [
        ('avatar', 'Avatar'),
        ('frame', 'Frame'),
        ('title', 'Title'),
        ('theme', 'Theme'),
    ]

    name = models.CharField(
        max_length=100
    )

    item_type = models.CharField(
        max_length=20,
        choices=ITEM_TYPES
    )

    cost = models.IntegerField()

    image = models.TextField(blank=True)

    def __str__(self):
        return self.name


class ActivityLog(models.Model):

    ACTION_CHOICES = [
        ('user_created', 'User Created'),
        ('user_deleted', 'User Deleted'),
        ('user_role_changed', 'Role Changed'),
        ('game_submitted', 'Game Submitted'),
        ('achievement_unlocked', 'Achievement Unlocked'),
    ]

    action = models.CharField(
        max_length=50,
        choices=ACTION_CHOICES
    )

    user = models.CharField(
        max_length=150
    )

    description = models.TextField()

    metadata = models.JSONField(
        default=dict
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    class Meta:
        ordering = ['-created_at']

class DailyStreak(models.Model):
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='daily_streak'
    )

    current_streak = models.IntegerField(default=0)

    longest_streak = models.IntegerField(default=0)

    last_played_date = models.DateField(
        null=True,
        blank=True
    )

    total_days_played = models.IntegerField(
        default=0
    )

    def __str__(self):
        return f"{self.user.username} - {self.current_streak}"