from django.contrib import admin
from .models import UserProfile, Leaderboard

@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'role', 'created_at']
    list_filter = ['role', 'created_at']
    search_fields = ['user__username']

@admin.register(Leaderboard)
class LeaderboardAdmin(admin.ModelAdmin):
    list_display = ['username', 'score', 'wpm', 'timestamp']
    list_filter = ['timestamp']
    search_fields = ['username']
