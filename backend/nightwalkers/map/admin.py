from django.contrib import admin
from django.core.exceptions import ValidationError
from django.utils.html import format_html
from django.urls import reverse
from django import forms
from .models import IssueOnLocationReport


class IssueOnLocationReportAdminForm(forms.ModelForm):
    class Meta:
        model = IssueOnLocationReport
        fields = '__all__'

    def clean(self):
        cleaned_data = super().clean()
        status = cleaned_data.get('status')
        rejection_reason = cleaned_data.get('rejection_reason')

        if status == 'rejected' and not rejection_reason:
            raise forms.ValidationError("You must provide a rejection reason when rejecting a report.")

        return cleaned_data


class IssueOnLocationReportAdmin(admin.ModelAdmin):
    form = IssueOnLocationReportAdminForm
    list_display = ('status_badge', 'title_preview', 'created_at_formatted', 'user_link')
    list_filter = ('status', 'created_at')
    search_fields = ('title', 'description', 'location_str', 'user__email', 'user__first_name', 'user__last_name')
    readonly_fields = ('created_at', 'user_link', 'location_map')
    date_hierarchy = 'created_at'

    def status_badge(self, obj):
        """Return colored status badge based on report status"""
        colors = {
            'pending': '#FFA500',  # Orange
            'approved': '#28a745',  # Green
            'rejected': '#dc3545'  # Red
        }

        status_text = dict(obj.report_status).get(obj.status, obj.status)
        background_color = colors.get(obj.status, '#6c757d')  # Default gray

        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 8px; '
            'border-radius: 5px; font-weight: bold;">{}</span>',
            background_color,
            status_text
        )

    status_badge.short_description = 'Status'
    status_badge.admin_order_field = 'status'

    def title_preview(self, obj):
        """Return linked title with preview"""
        url = reverse("admin:%s_%s_change" % (obj._meta.app_label, obj._meta.model_name), args=[obj.id])
        return format_html('<a href="{}">{}</a>', url, obj.title)

    title_preview.short_description = 'Report Title'

    def created_at_formatted(self, obj):
        return obj.created_at.strftime("%b %d, %Y %H:%M")

    created_at_formatted.short_description = 'Created'
    created_at_formatted.admin_order_field = 'created_at'

    def user_link(self, obj):
        """Return linked user using the correct URL pattern"""
        if obj.user:
            url = reverse("admin:accounts_user_change", args=[obj.user.id])
            return format_html('<a href="{}">{}</a>', url, obj.user.get_full_name())
        return "Unknown User"

    user_link.short_description = 'Reported By'

    def location_map(self, obj):
        """Display a small map preview or coordinates"""
        return format_html(
            '<div style="margin-bottom: 10px;">'
            '<strong>Coordinates:</strong> {}, {}<br/>'
            '<a href="https://www.google.com/maps/search/?api=1&query={},{}" '
            'target="_blank" style="background-color: #007bff; color: white; '
            'padding: 5px 10px; border-radius: 5px; text-decoration: none; '
            'display: inline-block; margin-top: 5px;">'
            '<span style="vertical-align: middle;">View on Google Maps</span>'
            '</a></div>',
            obj.latitude, obj.longitude, obj.latitude, obj.longitude
        )

    location_map.short_description = 'Location'

    fieldsets = (
        ('Report Information', {
            'fields': ('title', 'description', 'created_at')
        }),
        ('Location', {
            'fields': ('location_map', 'location_str', 'latitude', 'longitude')
        }),
        ('Status', {
            'fields': ('status', 'rejection_reason'),
            'description': 'If rejecting a report, you must provide a reason.'
        }),
        ('User Information', {
            'fields': ('user_link',),
        }),
        ('Technical Details', {
            'fields': ('user',),
            'classes': ('collapse',),
        }),
    )

    def save_model(self, request, obj, form, change):
        """
        Override save method to enforce rejection reason when status is 'rejected'
        """
        if obj.status == 'rejected' and not obj.rejection_reason:
            raise ValidationError("You must provide a rejection reason when rejecting a report.")

        super().save_model(request, obj, form, change)


# Register the model with the custom admin class
admin.site.register(IssueOnLocationReport, IssueOnLocationReportAdmin)