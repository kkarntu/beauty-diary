export interface AuditLogSnapshot {
  id: string;
  actorId: string;
  action: string;
  targetType: string;
  targetId: string | null;
  metadata: Record<string, unknown>;
  createdAt: Date;
}

export class AuditLogEntry {
  private constructor(private readonly state: AuditLogSnapshot) {}

  static rehydrate(snapshot: AuditLogSnapshot): AuditLogEntry {
    return new AuditLogEntry(snapshot);
  }

  static create(input: {
    id: string;
    actorId: string;
    action: string;
    targetType: string;
    targetId: string | null;
    metadata?: Record<string, unknown>;
  }): AuditLogEntry {
    return new AuditLogEntry({
      id: input.id,
      actorId: input.actorId,
      action: input.action,
      targetType: input.targetType,
      targetId: input.targetId,
      metadata: input.metadata ?? {},
      createdAt: new Date(),
    });
  }

  toSnapshot(): AuditLogSnapshot {
    return { ...this.state, metadata: { ...this.state.metadata } };
  }
}
