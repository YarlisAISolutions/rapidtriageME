/**
 * Workspace Management Service for RapidTriageME
 *
 * Handles workspace operations including:
 * - Workspace CRUD operations
 * - Project organization within workspaces
 * - Member management and permissions
 * - Workspace templates and cloning
 * - Activity tracking and analytics
 */

import { generateUUID } from '../utils/uuid';

// ============================================================================
// INTERFACES
// ============================================================================

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  description?: string;
  ownerId: string;
  organizationId?: string;
  parentWorkspaceId?: string;
  rootWorkspaceId?: string;
  hierarchyLevel: number;
  hierarchyPath: string[];
  type: 'personal' | 'team' | 'department' | 'company' | 'client' | 'template';
  visibility: 'private' | 'team' | 'organization' | 'public';
  status: 'active' | 'archived' | 'template' | 'deleted';
  icon?: string;
  color?: string;
  coverImageUrl?: string;
  theme: {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
  };
  settings: WorkspaceSettings;
  limits: WorkspaceLimits;
  statistics: WorkspaceStatistics;
  isTemplate: boolean;
  templateCategory?: string;
  tags: string[];
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  archivedAt?: string;
  deletedAt?: string;
}

export interface WorkspaceSettings {
  autoArchiveDays?: number;
  defaultProjectVisibility: 'workspace' | 'private' | 'public';
  allowGuestAccess: boolean;
  requireApproval: boolean;
  inheritParentSettings: boolean;
  defaultPermissions: Record<string, boolean>;
  notifications: {
    newProject: boolean;
    memberJoined: boolean;
    statusChange: boolean;
  };
}

export interface WorkspaceLimits {
  maxProjects: number;
  maxMembers: number;
  maxStorageGb: number;
  maxSubWorkspaces: number;
}

export interface WorkspaceStatistics {
  projectCount: number;
  memberCount: number;
  subWorkspaceCount: number;
  totalStorageBytes: number;
  lastActivityAt?: string;
}

export interface WorkspaceMember {
  id: string;
  workspaceId: string;
  userId: string;
  role: 'owner' | 'admin' | 'editor' | 'contributor' | 'viewer';
  customPermissions: {
    createProject: boolean;
    deleteProject: boolean;
    manageMembers: boolean;
    manageSettings: boolean;
    createSubWorkspace: boolean;
    exportData: boolean;
  };
  invitedBy?: string;
  invitationMessage?: string;
  isActive: boolean;
  joinedAt: string;
  lastAccessedAt?: string;
  accessCount: number;
  removedAt?: string;
}

export interface WorkspaceProject {
  id: string;
  workspaceId: string;
  projectId: string;
  folderPath: string[];
  displayOrder: number;
  isPinned: boolean;
  isArchived: boolean;
  isFavorite: boolean;
  visibility: 'private' | 'workspace' | 'public';
  inheritWorkspacePermissions: boolean;
  customPermissions: Record<string, any>;
  tags: string[];
  labels: Record<string, string>;
  customFields: Record<string, any>;
  lastActivityAt?: string;
  activityCount: number;
  addedAt: string;
  addedBy: string;
  archivedAt?: string;
  removedAt?: string;
}

export interface WorkspaceTemplate {
  id: string;
  name: string;
  slug: string;
  description?: string;
  category?: string;
  sourceWorkspaceId?: string;
  structure: {
    folders: string[];
    projects: Array<{
      name: string;
      type: string;
      settings?: Record<string, any>;
    }>;
    settings: Record<string, any>;
    permissions: Record<string, any>;
    workflows: any[];
  };
  variables: Array<{
    name: string;
    type: string;
    required: boolean;
    defaultValue?: any;
  }>;
  requirements: Record<string, any>;
  isPublic: boolean;
  isFeatured: boolean;
  organizationId?: string;
  usageCount: number;
  rating?: number;
  reviewCount: number;
  createdBy: string;
  tags: string[];
  previewImages: string[];
  documentationUrl?: string;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

// ============================================================================
// WORKSPACE SERVICE
// ============================================================================

export class WorkspaceService {
  private env: any;

  constructor(env: any) {
    this.env = env;
  }

  /**
   * Create a new workspace
   */
  async createWorkspace(params: {
    name: string;
    description?: string;
    ownerId: string;
    organizationId?: string;
    parentWorkspaceId?: string;
    type?: Workspace['type'];
    visibility?: Workspace['visibility'];
    settings?: Partial<WorkspaceSettings>;
    theme?: Partial<Workspace['theme']>;
  }): Promise<Workspace> {
    // Generate slug from name
    const slug = this.generateSlug(params.name);

    // Check if slug already exists
    if (await this.workspaceSlugExists(slug, params.organizationId)) {
      throw new Error(`Workspace with slug '${slug}' already exists`);
    }

    // Calculate hierarchy information
    let hierarchyLevel = 0;
    let hierarchyPath: string[] = [];
    let rootWorkspaceId: string | undefined;

    if (params.parentWorkspaceId) {
      const parentWorkspace = await this.getWorkspace(params.parentWorkspaceId);
      if (parentWorkspace) {
        hierarchyLevel = parentWorkspace.hierarchyLevel + 1;
        hierarchyPath = [...parentWorkspace.hierarchyPath, params.parentWorkspaceId];
        rootWorkspaceId = parentWorkspace.rootWorkspaceId || parentWorkspace.id;

        // Check depth limit
        if (hierarchyLevel > 5) {
          throw new Error('Maximum workspace hierarchy depth exceeded (5 levels)');
        }
      }
    }

    const workspace: Workspace = {
      id: generateUUID(),
      name: params.name,
      slug,
      description: params.description,
      ownerId: params.ownerId,
      organizationId: params.organizationId,
      parentWorkspaceId: params.parentWorkspaceId,
      rootWorkspaceId,
      hierarchyLevel,
      hierarchyPath,
      type: params.type || 'team',
      visibility: params.visibility || 'team',
      status: 'active',
      theme: {
        primary: '#667eea',
        secondary: '#764ba2',
        background: '#ffffff',
        surface: '#f5f5f5',
        ...params.theme
      },
      settings: {
        defaultProjectVisibility: 'workspace',
        allowGuestAccess: false,
        requireApproval: false,
        inheritParentSettings: true,
        defaultPermissions: {},
        notifications: {
          newProject: true,
          memberJoined: true,
          statusChange: true
        },
        ...params.settings
      },
      limits: {
        maxProjects: 100,
        maxMembers: 50,
        maxStorageGb: 100,
        maxSubWorkspaces: 10
      },
      statistics: {
        projectCount: 0,
        memberCount: 1, // Owner
        subWorkspaceCount: 0,
        totalStorageBytes: 0
      },
      isTemplate: false,
      tags: [],
      metadata: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Store workspace
    if (this.env.SESSIONS) {
      await this.env.SESSIONS.put(`workspace:${workspace.id}`, JSON.stringify(workspace));
      await this.env.SESSIONS.put(`workspace:slug:${workspace.slug}`, workspace.id);

      // Add owner as member
      await this.addMember({
        workspaceId: workspace.id,
        userId: params.ownerId,
        role: 'owner',
        invitedBy: params.ownerId
      });

      // Update parent workspace statistics
      if (params.parentWorkspaceId) {
        await this.updateWorkspaceStatistics(params.parentWorkspaceId);
      }
    }

    // Log activity
    await this.logActivity({
      workspaceId: workspace.id,
      userId: params.ownerId,
      action: 'workspace_created',
      entityType: 'workspace',
      entityId: workspace.id,
      metadata: { name: workspace.name }
    });

    return workspace;
  }

  /**
   * Get workspace by ID
   */
  async getWorkspace(workspaceId: string): Promise<Workspace | null> {
    if (!this.env.SESSIONS) return null;

    const data = await this.env.SESSIONS.get(`workspace:${workspaceId}`);
    return data ? JSON.parse(data) : null;
  }

  /**
   * Get workspace by slug
   */
  async getWorkspaceBySlug(slug: string, organizationId?: string): Promise<Workspace | null> {
    if (!this.env.SESSIONS) return null;

    const workspaceId = await this.env.SESSIONS.get(`workspace:slug:${slug}`);
    if (!workspaceId) return null;

    const workspace = await this.getWorkspace(workspaceId);

    // Check organization match if specified
    if (workspace && organizationId && workspace.organizationId !== organizationId) {
      return null;
    }

    return workspace;
  }

  /**
   * Update workspace
   */
  async updateWorkspace(
    workspaceId: string,
    updates: Partial<Workspace>,
    userId: string
  ): Promise<Workspace> {
    const workspace = await this.getWorkspace(workspaceId);
    if (!workspace) {
      throw new Error('Workspace not found');
    }

    // Check permissions
    const hasPermission = await this.checkPermission(workspaceId, userId, 'manageSettings');
    if (!hasPermission) {
      throw new Error('Insufficient permissions to update workspace');
    }

    // Apply updates
    const updatedWorkspace = {
      ...workspace,
      ...updates,
      id: workspace.id, // Prevent ID change
      updatedAt: new Date().toISOString()
    };

    // Store updated workspace
    if (this.env.SESSIONS) {
      await this.env.SESSIONS.put(`workspace:${workspaceId}`, JSON.stringify(updatedWorkspace));

      // Update slug mapping if changed
      if (updates.slug && updates.slug !== workspace.slug) {
        await this.env.SESSIONS.delete(`workspace:slug:${workspace.slug}`);
        await this.env.SESSIONS.put(`workspace:slug:${updates.slug}`, workspaceId);
      }
    }

    // Log activity
    await this.logActivity({
      workspaceId,
      userId,
      action: 'workspace_updated',
      entityType: 'workspace',
      entityId: workspaceId,
      oldValue: workspace,
      newValue: updatedWorkspace
    });

    return updatedWorkspace;
  }

  /**
   * Archive workspace
   */
  async archiveWorkspace(workspaceId: string, userId: string): Promise<void> {
    await this.updateWorkspace(
      workspaceId,
      {
        status: 'archived',
        archivedAt: new Date().toISOString()
      },
      userId
    );

    // Archive all sub-workspaces
    const subWorkspaces = await this.getSubWorkspaces(workspaceId);
    for (const subWorkspace of subWorkspaces) {
      await this.archiveWorkspace(subWorkspace.id, userId);
    }
  }

  /**
   * Delete workspace (soft delete)
   */
  async deleteWorkspace(workspaceId: string, userId: string): Promise<void> {
    await this.updateWorkspace(
      workspaceId,
      {
        status: 'deleted',
        deletedAt: new Date().toISOString()
      },
      userId
    );
  }

  /**
   * Add project to workspace
   */
  async addProject(params: {
    workspaceId: string;
    projectId: string;
    folderPath?: string[];
    userId: string;
  }): Promise<WorkspaceProject> {
    // Check permissions
    const hasPermission = await this.checkPermission(
      params.workspaceId,
      params.userId,
      'createProject'
    );
    if (!hasPermission) {
      throw new Error('Insufficient permissions to add project');
    }

    const workspaceProject: WorkspaceProject = {
      id: generateUUID(),
      workspaceId: params.workspaceId,
      projectId: params.projectId,
      folderPath: params.folderPath || [],
      displayOrder: 0,
      isPinned: false,
      isArchived: false,
      isFavorite: false,
      visibility: 'workspace',
      inheritWorkspacePermissions: true,
      customPermissions: {},
      tags: [],
      labels: {},
      customFields: {},
      activityCount: 0,
      addedAt: new Date().toISOString(),
      addedBy: params.userId
    };

    // Store workspace project
    if (this.env.SESSIONS) {
      await this.env.SESSIONS.put(
        `workspace:${params.workspaceId}:project:${params.projectId}`,
        JSON.stringify(workspaceProject)
      );

      // Update workspace statistics
      await this.updateWorkspaceStatistics(params.workspaceId);
    }

    // Log activity
    await this.logActivity({
      workspaceId: params.workspaceId,
      userId: params.userId,
      action: 'project_added',
      entityType: 'project',
      entityId: params.projectId
    });

    return workspaceProject;
  }

  /**
   * Remove project from workspace
   */
  async removeProject(workspaceId: string, projectId: string, userId: string): Promise<void> {
    // Check permissions
    const hasPermission = await this.checkPermission(workspaceId, userId, 'deleteProject');
    if (!hasPermission) {
      throw new Error('Insufficient permissions to remove project');
    }

    if (this.env.SESSIONS) {
      const key = `workspace:${workspaceId}:project:${projectId}`;
      const data = await this.env.SESSIONS.get(key);

      if (data) {
        const project = JSON.parse(data);
        project.removedAt = new Date().toISOString();
        await this.env.SESSIONS.put(key, JSON.stringify(project));
      }

      // Update workspace statistics
      await this.updateWorkspaceStatistics(workspaceId);
    }

    // Log activity
    await this.logActivity({
      workspaceId,
      userId,
      action: 'project_removed',
      entityType: 'project',
      entityId: projectId
    });
  }

  /**
   * Add member to workspace
   */
  async addMember(params: {
    workspaceId: string;
    userId: string;
    role: WorkspaceMember['role'];
    invitedBy: string;
    invitationMessage?: string;
  }): Promise<WorkspaceMember> {
    const member: WorkspaceMember = {
      id: generateUUID(),
      workspaceId: params.workspaceId,
      userId: params.userId,
      role: params.role,
      customPermissions: this.getDefaultPermissions(params.role),
      invitedBy: params.invitedBy,
      invitationMessage: params.invitationMessage,
      isActive: true,
      joinedAt: new Date().toISOString(),
      accessCount: 0
    };

    // Store member
    if (this.env.SESSIONS) {
      await this.env.SESSIONS.put(
        `workspace:${params.workspaceId}:member:${params.userId}`,
        JSON.stringify(member)
      );

      // Update workspace statistics
      await this.updateWorkspaceStatistics(params.workspaceId);
    }

    // Log activity
    await this.logActivity({
      workspaceId: params.workspaceId,
      userId: params.invitedBy,
      action: 'member_added',
      entityType: 'member',
      entityId: params.userId,
      metadata: { role: params.role }
    });

    return member;
  }

  /**
   * Remove member from workspace
   */
  async removeMember(workspaceId: string, userId: string, removedBy: string): Promise<void> {
    if (this.env.SESSIONS) {
      const key = `workspace:${workspaceId}:member:${userId}`;
      const data = await this.env.SESSIONS.get(key);

      if (data) {
        const member = JSON.parse(data);
        member.isActive = false;
        member.removedAt = new Date().toISOString();
        await this.env.SESSIONS.put(key, JSON.stringify(member));
      }

      // Update workspace statistics
      await this.updateWorkspaceStatistics(workspaceId);
    }

    // Log activity
    await this.logActivity({
      workspaceId,
      userId: removedBy,
      action: 'member_removed',
      entityType: 'member',
      entityId: userId
    });
  }

  /**
   * Get workspace members
   */
  async getMembers(workspaceId: string): Promise<WorkspaceMember[]> {
    // In production, this would query the database
    // For KV storage, we'd need to maintain an index
    return [];
  }

  /**
   * Get workspace projects
   */
  async getProjects(workspaceId: string): Promise<WorkspaceProject[]> {
    // In production, this would query the database
    // For KV storage, we'd need to maintain an index
    return [];
  }

  /**
   * Get sub-workspaces
   */
  async getSubWorkspaces(parentWorkspaceId: string): Promise<Workspace[]> {
    // In production, this would query the database
    // For KV storage, we'd need to maintain an index
    return [];
  }

  /**
   * Create workspace from template
   */
  async createFromTemplate(params: {
    templateId: string;
    name: string;
    ownerId: string;
    organizationId?: string;
    variables?: Record<string, any>;
  }): Promise<Workspace> {
    const template = await this.getTemplate(params.templateId);
    if (!template) {
      throw new Error('Template not found');
    }

    // Create workspace with template structure
    const workspace = await this.createWorkspace({
      name: params.name,
      description: template.description,
      ownerId: params.ownerId,
      organizationId: params.organizationId,
      type: 'team',
      settings: template.structure.settings as any
    });

    // Create folder structure
    // Create projects from template
    // Apply permissions

    // Update template usage count
    await this.incrementTemplateUsage(params.templateId);

    return workspace;
  }

  /**
   * Save workspace as template
   */
  async saveAsTemplate(params: {
    workspaceId: string;
    name: string;
    description?: string;
    category?: string;
    isPublic?: boolean;
    userId: string;
  }): Promise<WorkspaceTemplate> {
    const workspace = await this.getWorkspace(params.workspaceId);
    if (!workspace) {
      throw new Error('Workspace not found');
    }

    const template: WorkspaceTemplate = {
      id: generateUUID(),
      name: params.name,
      slug: this.generateSlug(params.name),
      description: params.description,
      category: params.category,
      sourceWorkspaceId: params.workspaceId,
      structure: {
        folders: [], // Extract from workspace projects
        projects: [], // Extract from workspace projects
        settings: workspace.settings as any,
        permissions: {},
        workflows: []
      },
      variables: [],
      requirements: {},
      isPublic: params.isPublic || false,
      isFeatured: false,
      organizationId: workspace.organizationId,
      usageCount: 0,
      reviewCount: 0,
      createdBy: params.userId,
      tags: workspace.tags,
      previewImages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Store template
    if (this.env.SESSIONS) {
      await this.env.SESSIONS.put(`template:${template.id}`, JSON.stringify(template));
      await this.env.SESSIONS.put(`template:slug:${template.slug}`, template.id);
    }

    return template;
  }

  /**
   * Get template by ID
   */
  async getTemplate(templateId: string): Promise<WorkspaceTemplate | null> {
    if (!this.env.SESSIONS) return null;

    const data = await this.env.SESSIONS.get(`template:${templateId}`);
    return data ? JSON.parse(data) : null;
  }

  /**
   * Check user permission in workspace
   */
  async checkPermission(
    workspaceId: string,
    userId: string,
    permission: keyof WorkspaceMember['customPermissions']
  ): Promise<boolean> {
    if (!this.env.SESSIONS) return false;

    // Get member
    const memberData = await this.env.SESSIONS.get(`workspace:${workspaceId}:member:${userId}`);
    if (!memberData) return false;

    const member: WorkspaceMember = JSON.parse(memberData);

    // Owners have all permissions
    if (member.role === 'owner') return true;

    // Admins have most permissions
    if (member.role === 'admin' && permission !== 'manageSettings') return true;

    // Check custom permissions
    return member.customPermissions[permission] || false;
  }

  /**
   * Get default permissions for role
   */
  private getDefaultPermissions(role: WorkspaceMember['role']): WorkspaceMember['customPermissions'] {
    switch (role) {
      case 'owner':
        return {
          createProject: true,
          deleteProject: true,
          manageMembers: true,
          manageSettings: true,
          createSubWorkspace: true,
          exportData: true
        };
      case 'admin':
        return {
          createProject: true,
          deleteProject: true,
          manageMembers: true,
          manageSettings: false,
          createSubWorkspace: true,
          exportData: true
        };
      case 'editor':
        return {
          createProject: true,
          deleteProject: false,
          manageMembers: false,
          manageSettings: false,
          createSubWorkspace: false,
          exportData: true
        };
      case 'contributor':
        return {
          createProject: false,
          deleteProject: false,
          manageMembers: false,
          manageSettings: false,
          createSubWorkspace: false,
          exportData: false
        };
      case 'viewer':
      default:
        return {
          createProject: false,
          deleteProject: false,
          manageMembers: false,
          manageSettings: false,
          createSubWorkspace: false,
          exportData: false
        };
    }
  }

  /**
   * Generate slug from name
   */
  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 100);
  }

  /**
   * Check if workspace slug exists
   */
  private async workspaceSlugExists(slug: string, organizationId?: string): Promise<boolean> {
    if (!this.env.SESSIONS) return false;

    const workspaceId = await this.env.SESSIONS.get(`workspace:slug:${slug}`);
    if (!workspaceId) return false;

    if (organizationId) {
      const workspace = await this.getWorkspace(workspaceId);
      return workspace?.organizationId === organizationId;
    }

    return true;
  }

  /**
   * Update workspace statistics
   */
  private async updateWorkspaceStatistics(workspaceId: string): Promise<void> {
    // In production, this would recalculate and update statistics
    // For KV storage, we'd maintain counters
  }

  /**
   * Increment template usage count
   */
  private async incrementTemplateUsage(templateId: string): Promise<void> {
    const template = await this.getTemplate(templateId);
    if (template) {
      template.usageCount++;
      if (this.env.SESSIONS) {
        await this.env.SESSIONS.put(`template:${templateId}`, JSON.stringify(template));
      }
    }
  }

  /**
   * Log workspace activity
   */
  private async logActivity(params: {
    workspaceId: string;
    userId: string;
    action: string;
    entityType?: string;
    entityId?: string;
    oldValue?: any;
    newValue?: any;
    metadata?: Record<string, any>;
  }): Promise<void> {
    const activity = {
      id: generateUUID(),
      ...params,
      createdAt: new Date().toISOString()
    };

    // Store activity log
    if (this.env.SESSIONS) {
      const key = `workspace:${params.workspaceId}:activity:${activity.id}`;
      await this.env.SESSIONS.put(key, JSON.stringify(activity), {
        expirationTtl: 30 * 24 * 60 * 60 // 30 days
      });
    }
  }
}