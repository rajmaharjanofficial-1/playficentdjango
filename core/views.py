
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.models import User
from django.db.models import Avg, Max
import json

from .models import (
    UserProfile,
    Leaderboard,
    GameSession,
    Achievement,
    UserAchievement,
    DailyQuest,
    UserQuest,
)


# =====================================
# HOME API
# =====================================

def api_home(request):
    return JsonResponse({
        "message": "Typing Game API Running"
    })


# =====================================
# PROFILE
# =====================================

def profile(request):

    if not request.user.is_authenticated:
        return JsonResponse(
            {"error": "Login required"},
            status=401
        )

    profile = request.user.profile

    return JsonResponse({
        "username": request.user.username,
        "level": profile.level,
        "xp": profile.xp,
        "coins": profile.coins,
        "best_score": profile.best_score,
        "best_wpm": profile.best_wpm,
        "games": profile.total_games,
        "accuracy": profile.average_accuracy,
        "avatar": profile.avatar_url,
    })


# =====================================
# LEADERBOARD
# =====================================

def leaderboard(request):

    scores = Leaderboard.objects.select_related(
        "user"
    ).order_by("-score")[:100]

    data = []

    rank = 1

    for item in scores:

        avatar = ""

        if item.user and hasattr(item.user, "profile"):
            avatar = item.user.profile.avatar_url

        data.append({
            "rank": rank,
            "id": item.id,
            "username": item.username,
            "score": item.score,
            "wpm": item.wpm,
            "accuracy": item.accuracy,
            "difficulty": item.difficulty,
            "avatar_url": avatar,
        })

        rank += 1

    return JsonResponse(data, safe=False)


# =====================================
# SUBMIT GAME
# =====================================

@csrf_exempt
def submit_score(request):

    if request.method != "POST":
        return JsonResponse(
            {"error": "POST required"},
            status=400
        )

    try:

        data = json.loads(request.body)

        username = data.get("username")
        score = int(data.get("score", 0))
        wpm = float(data.get("wpm", 0))
        accuracy = float(data.get("accuracy", 0))
        difficulty = data.get("difficulty", "normal")
        duration = int(data.get("duration", 60))
        words_typed = int(data.get("words_typed", 0))

        user = User.objects.get(
            username=username
        )

        profile = user.profile

        xp_earned = max(10, score // 10)
        coins_earned = max(5, score // 20)

        profile.xp += xp_earned
        profile.coins += coins_earned

        while profile.xp >= profile.level * 100:
            profile.xp -= profile.level * 100
            profile.level += 1

        profile.total_games += 1
        profile.total_score += score
        profile.total_words_typed += words_typed

        if score > profile.best_score:
            profile.best_score = score

        if wpm > profile.best_wpm:
            profile.best_wpm = wpm

        profile.save()

        Leaderboard.objects.create(
            user=user,
            username=username,
            score=score,
            wpm=wpm,
            accuracy=accuracy,
            difficulty=difficulty,
        )

        GameSession.objects.create(
            user=user,
            username=username,
            score=score,
            wpm=wpm,
            accuracy=accuracy,
            difficulty=difficulty,
            duration=duration,
            words_typed=words_typed,
            xp_earned=xp_earned,
            coins_earned=coins_earned,
        )

        return JsonResponse({
            "success": True,
            "xp_earned": xp_earned,
            "coins_earned": coins_earned,
            "level": profile.level,
        })

    except Exception as e:

        return JsonResponse({
            "error": str(e)
        }, status=500)


# =====================================
# STATS
# =====================================

def stats(request):

    return JsonResponse({

        "total_users":
        User.objects.count(),

        "total_scores":
        Leaderboard.objects.count(),

        "highest_score":
        Leaderboard.objects.aggregate(
            Max("score")
        )["score__max"] or 0,

        "average_wpm":
        round(
            Leaderboard.objects.aggregate(
                Avg("wpm")
            )["wpm__avg"] or 0,
            2
        )
    })


# =====================================
# ACHIEVEMENTS
# =====================================

def achievements(request):

    if not request.user.is_authenticated:

        return JsonResponse(
            [],
            safe=False
        )

    unlocked = UserAchievement.objects.filter(
        user=request.user
    )

    data = []

    for item in unlocked:

        data.append({
            "name":
            item.achievement.name,

            "description":
            item.achievement.description,

            "icon":
            item.achievement.icon,

            "tier":
            item.achievement.tier,
        })

    return JsonResponse(
        data,
        safe=False
    )


# =====================================
# DAILY QUESTS
# =====================================

def daily_quests(request):

    quests = DailyQuest.objects.all()

    result = []

    for q in quests:

        result.append({
            "id": q.id,
            "title": q.title,
            "description": q.description,
            "target": q.target,
            "reward_xp": q.reward_xp,
            "reward_coins": q.reward_coins,
        })

    return JsonResponse(
        result,
        safe=False
    )

