from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.utils.html import format_html
from django.urls import reverse
from django.db.models import Count
from .models import User, Follow, ReportIssue


# Inline admin for displaying follows in user detail view
class FollowingInline(admin.TabularInline):
    model = Follow
    fk_name = 'main_user'
    verbose_name = "Following"
    verbose_name_plural = "Following"
    extra = 0
    readonly_fields = ('following_user', 'created_at')
    can_delete = False

    def has_add_permission(self, request, obj=None):
        return False


class FollowersInline(admin.TabularInline):
    model = Follow
    fk_name = 'following_user'
    verbose_name = "Follower"
    verbose_name_plural = "Followers"
    extra = 0
    readonly_fields = ('main_user', 'created_at')
    can_delete = False

    def has_add_permission(self, request, obj=None):
        return False


# Inline admin for displaying reported issues
class ReportIssueInline(admin.TabularInline):
    model = ReportIssue
    verbose_name = "Reported Issue"
    verbose_name_plural = "Reported Issues"
    extra = 0
    readonly_fields = ('title', 'description', 'reported_at')
    can_delete = False

    def has_add_permission(self, request, obj=None):
        return False


class CustomUserAdmin(UserAdmin):
    list_display = (
        'email',
        'get_full_name_display',
        'karma',
        'get_followers_count_display',
        'get_following_count_display',
        'get_saved_routes_count_display',
        'provider',
        'email_verified',
        'is_active',
        'is_staff',
        'is_admin',
        'date_joined'
    )
    list_filter = ('is_staff', 'is_superuser', 'is_admin', 'is_active', 'email_verified', 'provider', 'date_joined')
    search_fields = ('email', 'first_name', 'last_name')
    ordering = ('-date_joined',)
    readonly_fields = ('date_joined', 'avatar_preview', 'karma', 'provider', 'provider_id')
    list_per_page = 25
    actions = ['verify_email', 'activate_users', 'deactivate_users']

    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Personal info', {'fields': ('first_name', 'last_name', 'avatar_preview', 'avatar', 'avatar_url')}),
        ('Stats', {'fields': ('karma', 'provider', 'provider_id')}),
        ('Permissions', {
            'fields': (
                'is_active',
                'is_staff',
                'is_superuser',
                'is_admin',
                'email_verified',
                'is_banned'
            ),
        }),
        ('Important dates', {'fields': ('last_login', 'date_joined')}),
    )

    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'first_name', 'last_name', 'password1', 'password2'),
        }),
    )

    inlines = [FollowingInline, FollowersInline, ReportIssueInline]

    def get_queryset(self, request):
        queryset = super().get_queryset(request)
        queryset = queryset.annotate(
            followers_count=Count('followers', distinct=True),
            following_count=Count('following', distinct=True),
        )
        return queryset

    def avatar_preview(self, obj):
        if obj.get_avatar:
            return format_html('<img src="{}" width="50" height="50" style="border-radius: 50%;" />', obj.get_avatar)
        return "(No avatar)"

    avatar_preview.short_description = "Avatar Preview"

    def get_full_name_display(self, obj):
        return obj.get_full_name()

    get_full_name_display.short_description = "Full Name"
    get_full_name_display.admin_order_field = 'first_name'

    def get_followers_count_display(self, obj):
        url = reverse('admin:accounts_user_changelist')
        if hasattr(obj, 'followers_count'):
            count = obj.followers_count
        else:
            count = obj.get_followers_count()
        return format_html('<a href="{}?followers__id__exact={}">{}</a>', url, obj.id, count)

    get_followers_count_display.short_description = "Followers"
    get_followers_count_display.admin_order_field = '-followers_count'

    def get_following_count_display(self, obj):
        url = reverse('admin:accounts_user_changelist')
        if hasattr(obj, 'following_count'):
            count = obj.following_count
        else:
            count = obj.get_following_count()
        return format_html('<a href="{}?following__id__exact={}">{}</a>', url, obj.id, count)

    get_following_count_display.short_description = "Following"
    get_following_count_display.admin_order_field = '-following_count'

    def get_saved_routes_count_display(self, obj):
        return obj.get_saved_routes_count()

    get_saved_routes_count_display.short_description = "Saved Routes"

    # Custom admin actions
    def verify_email(self, request, queryset):
        updated = queryset.update(email_verified=True)
        self.message_user(request, f'{updated} users have been marked as email verified.')

    verify_email.short_description = "Mark selected users as email verified"

    def activate_users(self, request, queryset):
        updated = queryset.update(is_active=True)
        self.message_user(request, f'{updated} users have been activated.')

    activate_users.short_description = "Activate selected users"

    def deactivate_users(self, request, queryset):
        updated = queryset.update(is_active=False)
        self.message_user(request, f'{updated} users have been deactivated.')

    deactivate_users.short_description = "Deactivate selected users"


class FollowAdmin(admin.ModelAdmin):
    list_display = ('main_user', 'following_user', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('main_user__email', 'main_user__first_name', 'main_user__last_name',
                     'following_user__email', 'following_user__first_name', 'following_user__last_name')
    date_hierarchy = 'created_at'
    readonly_fields = ('created_at',)

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('main_user', 'following_user')


class ReportIssueAdmin(admin.ModelAdmin):
    list_display = ('id', 'title', 'user_link', 'reported_at', 'short_description')
    list_filter = ('reported_at',)
    search_fields = ('title', 'description', 'user__email', 'user__first_name', 'user__last_name')
    date_hierarchy = 'reported_at'
    readonly_fields = ('reported_at',)

    def user_link(self, obj):
        if obj.user:
            url = reverse('admin:accounts_user_change', args=[obj.user.id])
            return format_html('<a href="{}">{}</a>', url, obj.user.get_full_name())
        return "Unknown User"

    user_link.short_description = 'User'

    def short_description(self, obj):
        if len(obj.description) > 50:
            return obj.description[:50] + '...'
        return obj.description

    short_description.short_description = 'Description'


admin.site.register(User, CustomUserAdmin)
admin.site.register(Follow, FollowAdmin)
admin.site.register(ReportIssue, ReportIssueAdmin)