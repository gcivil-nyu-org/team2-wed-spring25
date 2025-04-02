from django.db import models
from django.contrib.auth.models import AbstractUser, BaseUserManager


class CustomUserManager(BaseUserManager):

    def create_user(self, email, first_name, last_name, password=None, **extra_fields):
        if not email:
            raise ValueError("Users must have an email address")
        if not first_name:
            raise ValueError("Users must have a first name")
        if not last_name:
            raise ValueError("Users must have a last name")

        email = self.normalize_email(email)
        user = self.model(
            email=email, first_name=first_name, last_name=last_name, **extra_fields
        )
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("is_admin", True)
        extra_fields.setdefault("is_active", True)
        extra_fields.setdefault("email_verified", True)
        extra_fields.setdefault("first_name", "Admin")
        extra_fields.setdefault("last_name", "User")
        return self.create_user(email, password=password, **extra_fields)


class User(AbstractUser):
    username = None
    email = models.EmailField(unique=True, db_index=True)
    first_name = models.CharField(max_length=150, blank=False, null=False)
    last_name = models.CharField(max_length=150, blank=False, null=False)
    email_verified = models.BooleanField(default=False)
    is_admin = models.BooleanField(default=False)
    is_staff = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    date_joined = models.DateTimeField(auto_now_add=True)
    provider = models.CharField(max_length=50, blank=True)
    provider_id = models.CharField(max_length=100, blank=True)
    avatar = models.ImageField(upload_to="avatars/", blank=True, null=True)
    avatar_url = models.URLField(blank=True, null=True, max_length=1024)
    karma = models.IntegerField(default=0)

    # Many-to-Many relationship for followers/following
    following = models.ManyToManyField(
        "self",  # Reference to the same model
        through="Follow",  # Use the Follow model as the intermediary
        symmetrical=False,
        # Relationships are not symmetrical (A follows B ≠ B follows A)
        related_name="followers",  # Reverse accessor for followers
    )

    objects = CustomUserManager()
    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["first_name", "last_name"]

    def __str__(self):
        return f"{self.get_full_name()} ({self.email}) {self.get_karma()}"

    def get_user_karma(self):
        return self.karma

    def get_full_name(self):
        return f"{self.first_name} {self.last_name}"

    def get_short_name(self):
        return self.first_name

    def has_verified_email(self):
        return self.email_verified

    def get_provider(self):
        return self.provider if self.provider else "email"

    def get_avatar_url(self):
        return self.avatar_url if self.avatar_url else None

    def get_user_id(self):
        return self.id if self.id else None

    def get_karma(self):
        return self.karma if self.karma else 0

    @property
    def get_avatar(self):
        """
            Returns the user avatar either uploaded \
            (if we end up supporting this but thought\
            I would add this now) or for now OAuth avatar
        """
        if self.avatar:
            return self.avatar.url
        elif self.avatar_url:
            return self.avatar_url
        return None

    def get_followers_count(self):
        return self.followers.count()

    def get_following_count(self):
        return self.following.count()

    def is_following(self, user):
        """Check if the current user is following the given user."""
        return self.following.filter(id=user.id).exists()

    def is_followed_by(self, user):
        """Check if the current user is followed by the given user."""
        return self.followers.filter(id=user.id).exists()

    def is_mutual_follow(self, user):
        """Check if both users follow each other."""
        return self.is_following(user) and self.is_followed_by(user)

    def get_saved_routes_count(self):
        """Returns the count of saved routes for this user"""
        return self.saved_routes.count()


class Follow(models.Model):
    # Main user (the one who is following)
    main_user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="main_user_following",
        db_index=True,  # Add index
    )
    # User being followed
    following_user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="following_user_followers",
        db_index=True,  # Add index
    )
    # Timestamp for when the follow relationship was created
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        # Ensure unique follow relationships
        unique_together = ("main_user", "following_user")
        # Order by creation time
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.main_user} follows {self.following_user}"
