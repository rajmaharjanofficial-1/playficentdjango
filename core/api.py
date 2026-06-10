from ninja import NinjaAPI, Schema
from typing import List, Optional
from .models import Leaderboard, UserProfile, GameSession, Achievement, UserAchievement, DailyStreak, ActivityLog
from django.contrib.auth.models import User
from django.contrib.auth import authenticate, login as django_login, logout as django_logout
from django.db import models
from datetime import timedelta, date
from django.utils import timezone

api = NinjaAPI()

# ==================== SCHEMAS ====================

class ScoreIn(Schema):
    username: Optional[str] = None
    score: int
    wpm: float
    difficulty: str = 'normal'
    accuracy: Optional[float] = 0.0
    duration: Optional[int] = 0
    words_typed: Optional[int] = 0

class ScoreOut(Schema):
    id: int
    username: str
    score: int
    wpm: float
    difficulty: str
    accuracy: float
    avatar_url: Optional[str] = None

class GameSessionOut(Schema):
    id: int
    username: str
    difficulty: str
    score: int
    wpm: float
    accuracy: float
    duration: int
    timestamp: str

class AchievementOut(Schema):
    id: int
    name: str
    description: str
    icon: str
    tier: str

class StreakOut(Schema):
    current_streak: int
    longest_streak: int
    total_days_played: int
    last_played_date: Optional[str] = None

class UserRankingOut(Schema):
    rank: int
    username: str
    total_score: int
    total_games: int
    best_difficulty: str

class AuthIn(Schema):
    username: str
    password: str

class UserProfileOut(Schema):
    id: int
    username: str
    role: str
    bio: str
    avatar_url: str
    created_at: str

class UserOut(Schema):
    id: int
    username: str
    email: str
    first_name: str
    last_name: str

class UserDetailOut(Schema):
    id: int
    username: str
    email: str
    first_name: str
    last_name: str
    role: str
    bio: str
    avatar_url: str
    created_at: str

class ProfileUpdateIn(Schema):
    email: str = None
    first_name: str = None
    last_name: str = None
    bio: str = None
    avatar_url: str = None
    password: str = None

class UserUpdateIn(Schema):
    email: str = None
    first_name: str = None
    last_name: str = None
    role: str = None

class PersonalBestOut(Schema):
    difficulty: str
    best_score: int
    best_wpm: float
    games_played: int

class UserStatsOut(Schema):
    total_games: int
    total_score: int
    average_score: float
    best_overall_score: int
    best_overall_wpm: float
    easy: Optional[PersonalBestOut] = None
    normal: Optional[PersonalBestOut] = None
    hard: Optional[PersonalBestOut] = None
    insane: Optional[PersonalBestOut] = None

# ==================== AUTH ENDPOINTS ====================

@api.post("/auth/register", response={200: UserDetailOut, 400: dict})
def register(request, payload: AuthIn):
    if User.objects.filter(username=payload.username).exists():
        return 400, {"error": "Username already exists"}
    user = User.objects.create_user(username=payload.username, password=payload.password)
    UserProfile.objects.create(user=user)  # Create default profile
    django_login(request, user)
    
    profile = user.profile
    return 200, {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "role": profile.role,
        "bio": profile.bio,
        "avatar_url": profile.avatar_url,
        "created_at": profile.created_at.isoformat()
    }

@api.post("/auth/login", response={200: UserDetailOut, 401: dict})
def login_view(request, payload: AuthIn):
    user = authenticate(username=payload.username, password=payload.password)
    if user is not None:
        django_login(request, user)
        profile = user.profile if hasattr(user, 'profile') else UserProfile.objects.create(user=user)
        return 200, {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "role": profile.role,
            "bio": profile.bio,
            "avatar_url": profile.avatar_url,
            "created_at": profile.created_at.isoformat()
        }
    return 401, {"error": "Invalid credentials"}

@api.post("/auth/logout")
def logout_view(request):
    django_logout(request)
    return {"success": True}

@api.get("/auth/me", response={200: UserDetailOut, 401: dict})
def get_me(request):
    if request.user.is_authenticated:
        profile = request.user.profile if hasattr(request.user, 'profile') else UserProfile.objects.create(user=request.user)
        return 200, {
            "id": request.user.id,
            "username": request.user.username,
            "email": request.user.email,
            "first_name": request.user.first_name,
            "last_name": request.user.last_name,
            "role": profile.role,
            "bio": profile.bio,
            "avatar_url": profile.avatar_url,
            "created_at": profile.created_at.isoformat()
        }
    return 401, {"error": "Not authenticated"}

# ==================== SCORE ENDPOINTS ====================

def check_achievements(user, username, stats):
    """Check and unlock achievements"""
    new_achievements = []
    user_obj = user if isinstance(user, User) else None
    
    achievements = {
        'first_game': ('score_0', 1),
        'score_100': ('score_100', 100),
        'score_500': ('score_500', 500),
        'score_1000': ('score_1000', 1000),
        'wpm_50': ('wpm_50', 50),
        'games_10': ('games_10', 10),
        'games_50': ('games_50', 50),
        'hard_mode_10': ('hard_10', 10),
    }
    
    try:
        # Check score-based achievements
        if stats.get('best_overall_score', 0) >= 100:
            ach, created = UserAchievement.objects.get_or_create(
                user=user_obj,
                achievement=Achievement.objects.get(condition='score_100')
            ) if user_obj else (None, False)
            if created:
                new_achievements.append({'name': 'Score 100', 'icon': '🎯'})
        
        if stats.get('total_games', 0) >= 10:
            ach, created = UserAchievement.objects.get_or_create(
                user=user_obj,
                achievement=Achievement.objects.get(condition='games_10')
            ) if user_obj else (None, False)
            if created:
                new_achievements.append({'name': '10 Games Played', 'icon': '🎮'})
    except:
        pass
    
    return new_achievements

def update_daily_streak(user):
    """Update user's daily streak"""
    if not user:
        return None
    
    today = date.today()
    try:
        streak = DailyStreak.objects.get(user=user)
        yesterday = today - timedelta(days=1)
        
        if streak.last_played_date == today:
            return streak  # Already played today
        elif streak.last_played_date == yesterday:
            # Continue streak
            streak.current_streak += 1
            streak.total_days_played += 1
        else:
            # Streak broken
            if streak.current_streak > streak.longest_streak:
                streak.longest_streak = streak.current_streak
            streak.current_streak = 1
            streak.total_days_played += 1
        
        streak.last_played_date = today
        streak.save()
        return streak
    except DailyStreak.DoesNotExist:
        return DailyStreak.objects.create(
            user=user,
            current_streak=1,
            last_played_date=today,
            total_days_played=1
        )

@api.post("/score/submit", response=ScoreOut)
def submit_score(request, payload: ScoreIn):
    """Submit a game score with full tracking"""
    username = payload.username
    if not username and request.user.is_authenticated:
        username = request.user.username
    
    if not username:
        from ninja import HttpError
        raise HttpError(400, "Username required for score submission")
    
    # Get or create user
    user_obj = request.user if request.user.is_authenticated else None
    
    # Create leaderboard entry
    entry = Leaderboard.objects.create(
        user=user_obj,
        username=username,
        score=payload.score,
        wpm=payload.wpm,
        difficulty=payload.difficulty,
        accuracy=payload.accuracy
    )
    
    # Create game session record
    GameSession.objects.create(
        user=user_obj,
        username=username,
        difficulty=payload.difficulty,
        score=payload.score,
        wpm=payload.wpm,
        accuracy=payload.accuracy,
        duration=payload.duration,
        words_typed=payload.words_typed
    )
    
    # Update user profile stats
    if user_obj:
        profile = user_obj.profile
        profile.total_games += 1
        profile.total_score += payload.score
        profile.last_played = timezone.now()
        profile.save()
        
        # Update streak
        update_daily_streak(user_obj)
        
        # Check achievements
        check_achievements(user_obj, username, {
            'best_overall_score': payload.score,
            'total_games': profile.total_games
        })
    
    # Log activity
    ActivityLog.objects.create(
        action='game_submitted',
        user=username,
        description=f'Submitted score {payload.score} on {payload.difficulty}',
        metadata={'score': payload.score, 'difficulty': payload.difficulty}
    )
    
    return entry

@api.get("/leaderboard", response=List[ScoreOut])
def get_leaderboard(request, period='all', difficulty='all', limit=10):

    queryset = Leaderboard.objects.all()

    if difficulty != 'all':
        queryset = queryset.filter(difficulty=difficulty)

    if period == 'today':
        queryset = queryset.filter(
            timestamp__date=timezone.now().date()
        )

    elif period == 'week':
        queryset = queryset.filter(
            timestamp__gte=timezone.now() - timedelta(days=7)
        )

    elif period == 'month':
        queryset = queryset.filter(
            timestamp__gte=timezone.now() - timedelta(days=30)
        )

    results = queryset.order_by('-score')[:limit]

    output = []

    for item in results:

        avatar = None

        if item.user:
            try:
                avatar = item.user.profile.avatar_url
            except:
                pass

        output.append({
            "id": item.id,
            "username": item.username,
            "score": item.score,
            "wpm": item.wpm,
            "difficulty": item.difficulty,
            "accuracy": item.accuracy,
            "avatar_url": avatar
        })

    return output


    """
    Get leaderboard with optional filters
    period: 'today', 'week', 'month', 'all'
    difficulty: 'easy', 'normal', 'hard', 'insane', 'all'
    limit: number of results
    """


# ==================== USER PROFILE ENDPOINTS ====================

@api.get("/profile/me", response={200: UserDetailOut, 401: dict})
def get_profile(request):
    if not request.user.is_authenticated:
        return 401, {"error": "Not authenticated"}
    
    profile = request.user.profile if hasattr(request.user, 'profile') else UserProfile.objects.create(user=request.user)
    return 200, {
        "id": request.user.id,
        "username": request.user.username,
        "email": request.user.email,
        "first_name": request.user.first_name,
        "last_name": request.user.last_name,
        "role": profile.role,
        "bio": profile.bio,
        "avatar_url": profile.avatar_url,
        "created_at": profile.created_at.isoformat()
    }

@api.put("/profile/me", response={200: UserDetailOut, 400: dict, 401: dict})
def update_profile(request, payload: ProfileUpdateIn):
    if not request.user.is_authenticated:
        return 401, {"error": "Not authenticated"}
    
    user = request.user
    profile = user.profile if hasattr(user, 'profile') else UserProfile.objects.create(user=user)
    
    # Update user fields
    if payload.email:
        user.email = payload.email
    if payload.first_name:
        user.first_name = payload.first_name
    if payload.last_name:
        user.last_name = payload.last_name
    
    # Update profile fields
    if payload.bio is not None:
        profile.bio = payload.bio
    if payload.avatar_url:
        profile.avatar_url = payload.avatar_url
    
    # Update password if provided
    if payload.password:
        user.set_password(payload.password)
    
    user.save()
    profile.save()
    
    return 200, {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "role": profile.role,
        "bio": profile.bio,
        "avatar_url": profile.avatar_url,
        "created_at": profile.created_at.isoformat()
    }

@api.get("/user/statistics", response={200: UserStatsOut, 401: dict})
def get_user_statistics(request):
    """Get user's personal statistics and best scores per difficulty"""
    if not request.user.is_authenticated:
        return 401, {"error": "Not authenticated"}
    
    username = request.user.username
    scores = Leaderboard.objects.filter(username=username)
    
    if not scores.exists():
        return 200, {
            "total_games": 0,
            "total_score": 0,
            "average_score": 0.0,
            "best_overall_score": 0,
            "best_overall_wpm": 0.0,
            "easiest": None,
            "normal": None,
            "hard": None,
            "insane": None
        }
    
    total_games = scores.count()
    total_score = scores.aggregate(models.Sum('score'))['score__sum'] or 0
    average_score = total_score / total_games if total_games > 0 else 0.0
    
    best_overall = scores.order_by('-score').first()
    best_overall_score = best_overall.score if best_overall else 0
    best_overall_wpm = best_overall.wpm if best_overall else 0.0
    
    # Get best per difficulty
    result = {
        "total_games": total_games,
        "total_score": total_score,
        "average_score": float(average_score),
        "best_overall_score": best_overall_score,
        "best_overall_wpm": best_overall_wpm,
        "easiest": None,
        "normal": None,
        "hard": None,
        "insane": None
    }
    
    for difficulty in ['easy', 'normal', 'hard', 'insane']:
        diff_scores = scores.filter(difficulty=difficulty)
        if diff_scores.exists():
            best = diff_scores.order_by('-score').first()
            games = diff_scores.count()
            result[difficulty] = {
                "difficulty": difficulty,
                "best_score": best.score,
                "best_wpm": best.wpm,
                "games_played": games
            }
    
    return 200, result

@api.get("/user/achievements", response={200: dict, 401: dict})
def get_user_achievements(request):
    """Get achievements unlocked by the current user"""
    if not request.user.is_authenticated:
        return 401, {"error": "Not authenticated"}
    
    user_achievements = UserAchievement.objects.filter(
        user=request.user
    ).select_related('achievement').order_by('-unlocked_at')
    
    result = {
        "total_unlocked": user_achievements.count(),
        "achievements": [
            {
                "id": ua.achievement.id,
                "name": ua.achievement.name,
                "description": ua.achievement.description,
                "tier": ua.achievement.tier,
                "requirement": ua.achievement.requirement,
                "icon": ua.achievement.icon,
                "unlocked_at": ua.unlocked_at.isoformat()
            }
            for ua in user_achievements
        ]
    }
    return 200, result

@api.get("/user/streak", response={200: dict, 401: dict})
def get_user_streak(request):
    """Get user's daily streak information"""
    if not request.user.is_authenticated:
        return 401, {"error": "Not authenticated"}
    
    try:
        streak = DailyStreak.objects.get(user=request.user)
    except DailyStreak.DoesNotExist:
        streak = DailyStreak.objects.create(user=request.user)
    
    result = {
        "current_streak": streak.current_streak,
        "longest_streak": streak.longest_streak,
        "total_days_played": streak.total_days_played,
        "last_played_date": (
         streak.last_played_date.isoformat()
          if streak.last_played_date
         else None
          ),
        "today_played": False
    }
    
    # Check if user has played today
    if streak.last_played_date:
        from datetime import date
    result["today_played"] = streak.last_played_date == date.today()
    
    
    return 200, result

@api.get("/rankings", response={200: dict, 404: dict})
def get_rankings(request, difficulty: str = "all", limit: int = 50):
    """Get global user rankings by score"""
    valid_difficulties = ['all', 'easy', 'normal', 'hard', 'insane']
    if difficulty not in valid_difficulties:
        return 404, {"error": f"Invalid difficulty. Choose from {valid_difficulties}"}
    
    leaderboards = Leaderboard.objects.select_related('user').filter(
        user__isnull=False
    )
    
    if difficulty != 'all':
        leaderboards = leaderboards.filter(difficulty=difficulty)
    
    # Group by user and get best score
    from django.db.models import Max, F
    top_users = leaderboards.values('user__username', 'user__id').annotate(
        best_score=Max('score')
    ).order_by('-best_score')[:limit]
    
    result = {
        "difficulty": difficulty,
        "total_rankings": len(top_users),
        "rankings": []
    }
    
    for idx, entry in enumerate(top_users, 1):
        user = User.objects.get(id=entry['user__id'])
        profile = user.profile if hasattr(user, 'profile') else UserProfile.objects.create(user=user)
        result["rankings"].append({
            "rank": idx,
            "username": entry['user__username'],
            "best_score": entry['best_score'],
            "total_games": profile.total_games,
            "average_score": profile.total_score // max(profile.total_games, 1) if profile.total_games > 0 else 0
        })
    
    return 200, result

@api.get("/user/game-history", response={200: dict, 401: dict})
def get_game_history(request, limit: int = 20, difficulty: str = "all"):
    """Get user's game session history"""
    if not request.user.is_authenticated:
        return 401, {"error": "Not authenticated"}
    
    sessions = GameSession.objects.filter(
    user=request.user
     ).order_by('-timestamp')
    
    if difficulty != "all":
        sessions = sessions.filter(difficulty=difficulty)
    
    sessions = sessions[:limit]
    
    result = {
        "total_sessions": GameSession.objects.filter(user=request.user).count(),
        "sessions_displayed": len(sessions),
        "sessions": [
            {
                "id": session.id,
                "difficulty": session.difficulty,
                "score": session.score,
                "wpm": session.wpm,
                "accuracy": session.accuracy,
                "duration": session.duration,
                "words_typed": session.words_typed,
                "created_at": session.created_at.isoformat()
            }
            for session in sessions
        ]
    }
    return 200, result

# ==================== ADMIN ENDPOINTS ====================

@api.get("/admin/users", response={200: List[UserDetailOut], 403: dict})
def list_users(request):
    if not request.user.is_authenticated:
        return 403, {"error": "Not authenticated"}
    
    profile = request.user.profile if hasattr(request.user, 'profile') else UserProfile.objects.create(user=request.user)
    if profile.role != 'admin':
        return 403, {"error": "Admin access required"}
    
    users = User.objects.all()
    result = []
    for user in users:
        prof = user.profile if hasattr(user, 'profile') else UserProfile.objects.create(user=user)
        result.append({
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "role": prof.role,
            "bio": prof.bio,
            "avatar_url": prof.avatar_url,
            "created_at": prof.created_at.isoformat()
        })
    return 200, result

@api.put("/admin/users/{user_id}", response={200: UserDetailOut, 403: dict, 404: dict})
def update_user(request, user_id: int, payload: UserUpdateIn):
    if not request.user.is_authenticated:
        return 403, {"error": "Not authenticated"}
    
    profile = request.user.profile if hasattr(request.user, 'profile') else UserProfile.objects.create(user=request.user)
    if profile.role != 'admin':
        return 403, {"error": "Admin access required"}
    
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return 404, {"error": "User not found"}
    
    user_prof = user.profile if hasattr(user, 'profile') else UserProfile.objects.create(user=user)
    
    if payload.email:
        user.email = payload.email
    if payload.first_name:
        user.first_name = payload.first_name
    if payload.last_name:
        user.last_name = payload.last_name
    if payload.role:
        user_prof.role = payload.role
    
    user.save()
    user_prof.save()
    
    return 200, {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "role": user_prof.role,
        "bio": user_prof.bio,
        "avatar_url": user_prof.avatar_url,
        "created_at": user_prof.created_at.isoformat()
    }

@api.delete("/admin/users/{user_id}", response={200: dict, 403: dict, 404: dict})
def delete_user(request, user_id: int):
    if not request.user.is_authenticated:
        return 403, {"error": "Not authenticated"}
    
    profile = request.user.profile if hasattr(request.user, 'profile') else UserProfile.objects.create(user=request.user)
    if profile.role != 'admin':
        return 403, {"error": "Admin access required"}
    
    try:
        user = User.objects.get(id=user_id)
        username = user.username
        user.delete()
        return 200, {"success": True, "deleted_user": username}
    except User.DoesNotExist:
        return 404, {"error": "User not found"}

@api.get("/admin/stats", response={200: dict, 403: dict})
def get_admin_stats(request):
    if not request.user.is_authenticated:
        return 403, {"error": "Not authenticated"}
    
    profile = request.user.profile if hasattr(request.user, 'profile') else UserProfile.objects.create(user=request.user)
    if profile.role != 'admin':
        return 403, {"error": "Admin access required"}
    
    total_users = User.objects.count()
    total_scores = Leaderboard.objects.count()
    avg_score = Leaderboard.objects.values('score').aggregate(avg=models.Avg('score'))['avg'] or 0
    
    return 200, {
        "total_users": total_users,
        "total_scores": total_scores,
        "average_score": float(avg_score)
    }

@api.get("/admin/leaderboard", response={200: List[ScoreOut], 403: dict})
def admin_get_leaderboard(request, period: str = 'all', difficulty: str = 'all', limit: int = 100, username: str = None):
    """
    Admin leaderboard with filters
    period: 'today', 'week', 'month', 'all'
    difficulty: 'easy', 'normal', 'hard', 'insane', 'all'
    limit: max results
    username: filter by username
    """
    if not request.user.is_authenticated:
        return 403, {"error": "Not authenticated"}
    
    profile = request.user.profile if hasattr(request.user, 'profile') else UserProfile.objects.create(user=request.user)
    if profile.role != 'admin':
        return 403, {"error": "Admin access required"}
    
    queryset = Leaderboard.objects.all()
    
    # Filter by difficulty
    if difficulty != 'all':
        queryset = queryset.filter(difficulty=difficulty)
    
    # Filter by time period
    if period == 'today':
        queryset = queryset.filter(timestamp__date=timezone.now().date())
    elif period == 'week':
        queryset = queryset.filter(timestamp__gte=timezone.now() - timedelta(days=7))
    elif period == 'month':
        queryset = queryset.filter(timestamp__gte=timezone.now() - timedelta(days=30))
    
    # Filter by username
    if username:
        queryset = queryset.filter(username__icontains=username)
    
    # Sort and limit
    results = queryset.order_by('-score', '-timestamp')[:limit]
    
    # Add avatar_url to each result
    output = []
    for score in results:
        score_dict = {
            'id': score.id,
            'username': score.username,
            'score': score.score,
            'wpm': score.wpm,
            'difficulty': score.difficulty,
            'accuracy': score.accuracy,
            'avatar_url': None
        }
        
        # Get avatar from related user profile
        if score.user:
            try:
                score_dict['avatar_url'] = score.user.profile.avatar_url or None
            except UserProfile.DoesNotExist:
                score_dict['avatar_url'] = None
        
        output.append(score_dict)
    
    return 200, output

@api.delete("/admin/leaderboard/{score_id}", response={200: dict, 403: dict, 404: dict})
def delete_leaderboard_entry(request, score_id: int):
    if not request.user.is_authenticated:
        return 403, {"error": "Not authenticated"}
    
    profile = request.user.profile if hasattr(request.user, 'profile') else UserProfile.objects.create(user=request.user)
    if profile.role != 'admin':
        return 403, {"error": "Admin access required"}
    
    try:
        entry = Leaderboard.objects.get(id=score_id)
        entry.delete()
        return 200, {"success": True}
    except Leaderboard.DoesNotExist:
        return 404, {"error": "Score entry not found"}
