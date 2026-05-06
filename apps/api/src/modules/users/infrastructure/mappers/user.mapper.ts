import { User, type UserSnapshot } from '../../domain/user.entity';
import { UserOrmEntity } from '../persistence/user.orm-entity';

export class UserMapper {
  static toDomain(orm: UserOrmEntity): User {
    const snapshot: UserSnapshot = {
      id: orm.id,
      email: orm.email,
      nickname: orm.nickname,
      passwordHash: orm.passwordHash,
      role: orm.role,
      displayName: orm.displayName,
      avatarUrl: orm.avatarUrl,
      bio: orm.bio,
      isBlocked: orm.isBlocked,
      followersCount: orm.followersCount ?? 0,
      followingCount: orm.followingCount ?? 0,
      emailVerifiedAt: orm.emailVerifiedAt,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
    };
    return User.rehydrate(snapshot);
  }

  static toOrm(user: User): UserOrmEntity {
    const s = user.toSnapshot();
    const orm = new UserOrmEntity();
    orm.id = s.id;
    orm.email = s.email;
    orm.nickname = s.nickname;
    orm.passwordHash = s.passwordHash;
    orm.role = s.role;
    orm.displayName = s.displayName;
    orm.avatarUrl = s.avatarUrl;
    orm.bio = s.bio;
    orm.isBlocked = s.isBlocked;
    orm.followersCount = s.followersCount;
    orm.followingCount = s.followingCount;
    orm.emailVerifiedAt = s.emailVerifiedAt;
    orm.createdAt = s.createdAt;
    orm.updatedAt = s.updatedAt;
    return orm;
  }
}
