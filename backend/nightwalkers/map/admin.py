from django.contrib import admin, messages
from django.core.exceptions import ValidationError
from django.utils.html import format_html
from django.urls import reverse
from django import forms
from .models import IssueOnLocationReport
import json


class IssueOnLocationReportAdminForm(forms.ModelForm):
    class Meta:
        model = IssueOnLocationReport
        fields = "__all__"

    def clean(self):
        cleaned_data = super().clean()
        status = cleaned_data.get("status")
        rejection_reason = cleaned_data.get("rejection_reason")

        if status == "rejected" and not rejection_reason:
            raise forms.ValidationError(
                "You must provide a rejection reason when rejecting a report."
            )

        return cleaned_data


class IssueOnLocationReportAdmin(admin.ModelAdmin):
    form = IssueOnLocationReportAdminForm
    list_display = (
        "status_badge",
        "title_preview",
        "created_at_formatted",
        "user_link",
    )
    list_filter = ("status", "created_at")
    search_fields = (
        "title",
        "description",
        "location_str",
        "user__email",
        "user__first_name",
        "user__last_name",
    )
    readonly_fields = ("created_at", "user_link", "location_map")
    date_hierarchy = "created_at"

    def status_badge(self, obj):
        """Return colored status badge based on report status"""
        colors = {
            "pending": "#FFA500",  # Orange
            "approved": "#28a745",  # Green
            "rejected": "#dc3545",  # Red
        }

        status_text = dict(obj.report_status).get(obj.status, obj.status)
        background_color = colors.get(obj.status, "#6c757d")  # Default gray

        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 8px; '
            'border-radius: 5px; font-weight: bold;">{}</span>',
            background_color,
            status_text,
        )

    status_badge.short_description = "Status"
    status_badge.admin_order_field = "status"

    def title_preview(self, obj):
        """Return linked title with preview"""
        url = reverse(
            "admin:%s_%s_change" % (obj._meta.app_label, obj._meta.model_name),
            args=[obj.id],
        )
        return format_html('<a href="{}">{}</a>', url, obj.title)

    title_preview.short_description = "Report Title"

    def created_at_formatted(self, obj):
        return obj.created_at.strftime("%b %d, %Y %H:%M")

    created_at_formatted.short_description = "Created"
    created_at_formatted.admin_order_field = "created_at"

    def user_link(self, obj):
        """Return linked user using the correct URL pattern"""
        if obj.user:
            url = reverse("admin:accounts_user_change", args=[obj.user.id])
            return format_html('<a href="{}">{}</a>', url, obj.user.get_full_name())
        return "Unknown User"

    user_link.short_description = "Reported By"

    def location_map(self, obj):
        """Display a small map preview or coordinates"""
        return format_html(
            '<div style="margin-bottom: 10px;">'
            "<strong>Coordinates:</strong> {}, {}<br/>"
            '<a href="https://www.google.com/maps/search/?api=1&query={},{}" '
            'target="_blank" style="background-color: #007bff; color: white; '
            "padding: 5px 10px; border-radius: 5px; text-decoration: none; "
            'display: inline-block; margin-top: 5px;">'
            '<span style="vertical-align: middle;">View on Google Maps</span>'
            "</a></div>",
            obj.latitude,
            obj.longitude,
            obj.latitude,
            obj.longitude,
        )

    location_map.short_description = "Location"

    def heatmap_point_display(self, obj):
        """Display the heatmap point ID if it exists"""
        if obj.heatmap_point_id:
            return obj.heatmap_point_id
        return "-"

    heatmap_point_display.short_description = "Heatmap Point ID"
    fieldsets = (
        ("Report Information", {"fields": ("title", "description", "created_at")}),
        (
            "Location",
            {"fields": ("location_map", "location_str", "latitude", "longitude")},
        ),
        (
            "Status",
            {
                "fields": ("status", "rejection_reason", "heatmap_point_id"),
                "description": "If rejecting a report, you must provide a reason.",
            },
        ),
        (
            "User Information",
            {
                "fields": ("user_link",),
            },
        ),
        (
            "Technical Details",
            {
                "fields": ("user",),
                "classes": ("collapse",),
            },
        ),
    )

    def save_model(self, request, obj, form, change):
        """
        Override save method to:
        1. Enforce rejection reason validation
        2. Process approved reports
        3. Handle revocation of approval
        """
        if obj.status == "rejected" and not obj.rejection_reason:
            raise ValidationError(
                "You must provide a rejection reason when rejecting a report."
            )

        # Check if this is a status change to approved
        is_newly_approved = (
            change and "status" in form.changed_data and obj.status == "approved"
        )

        # Check if this is a status change FROM approved TO something else
        is_approval_revoked = (
            change
            and "status" in form.changed_data
            and form.initial["status"] == "approved"
            and obj.status != "approved"
        )

        # If this is an approval revocation, handle it before saving
        if is_approval_revoked and obj.heatmap_point_id:
            try:
                print(f"Processing approval revocation for report {obj.id}")

                # Use the API endpoint for revocation
                from django.test import RequestFactory

                process_url = reverse("revoke-report-approval")
                factory = RequestFactory()
                process_request = factory.post(process_url, data={"report_id": obj.id})
                process_request.user = request.user

                # Call the view directly
                from django.urls import resolve

                view_func, args, kwargs = resolve(process_url)
                response = view_func(process_request)

                # Process the response
                response_data = json.loads(response.content.decode("utf-8"))
                print(f"Response status: {response.status_code}")
                print(f"Response content: {response_data}")

                if response.status_code >= 400:
                    messages.error(
                        request,
                        (
                            "The approval was revoked, but there was an error on map: "
                            f"{response_data.get('error', 'Unknown error')}",
                        ),
                    )
                else:
                    if response_data.get("was_deleted", False):
                        messages.info(
                            request,
                            (
                                "Approval revoked and heatmap point"
                                " removed because complaint count reached 0."
                            ),
                        )
                    else:
                        messages.info(
                            request,
                            (
                                "Approval revoked and map point updated. New Count: "
                                f"{response_data.get('new_complaint_count')}"
                            ),
                        )

            except Exception as e:
                print(f"Error processing approval revocation: {str(e)}")
                import traceback

                traceback.print_exc()

                messages.error(
                    request,
                    (
                        "The approval was revoked, but there was"
                        " an error updating the heatmap: "
                        f"{str(e)}"
                    ),
                )

        # Save the model
        super().save_model(request, obj, form, change)

        # If this is a newly approved report, process it
        if is_newly_approved:
            try:
                print(f"Processing newly approved report {obj.id}")

                # Direct server-side call using Django's built-in methods
                from django.test import RequestFactory

                process_url = reverse("process-approved-report")
                factory = RequestFactory()
                process_request = factory.post(process_url, data={"report_id": obj.id})
                process_request.user = request.user

                # Call the view directly
                from django.urls import resolve

                view_func, args, kwargs = resolve(process_url)
                response = view_func(process_request)

                # Process the response
                response_data = json.loads(response.content.decode("utf-8"))
                print(f"Response status: {response.status_code}")
                print(f"Response content: {response_data}")

                if response.status_code >= 400:
                    messages.error(
                        request,
                        (
                            "The report was approved, "
                            "but there was an error processing it: "
                            f"{response_data.get('error', 'Unknown error')}"
                        ),
                    )
                else:
                    # Store the heatmap point ID in the report
                    point_id = response_data.get("point_id")

                    # Update the report with the heatmap point ID
                    obj.heatmap_point_id = point_id
                    obj.save(update_fields=["heatmap_point_id"])

                    # Success message based on what action was taken
                    if response_data.get("message") == "Updated existing point":
                        messages.success(
                            request,
                            (
                                "Report approved and added to existing point"
                                f" (ID: {point_id}). New complaint count: "
                                f"{response_data.get('new_complaint_count')}"
                            ),
                        )
                    else:
                        messages.success(
                            request,
                            (
                                "Report approved and new point "
                                f"created with ID: {point_id}"
                            ),
                        )

            except Exception as e:
                print(f"Error processing approved report: {str(e)}")
                import traceback

                traceback.print_exc()

                messages.error(
                    request,
                    (
                        "The report was approved, "
                        f"but there was an error processing it: {str(e)}",
                    ),
                )


# Register the model with the custom admin class
admin.site.register(IssueOnLocationReport, IssueOnLocationReportAdmin)
