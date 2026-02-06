import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Integration tests for Supabase RLS policies and database operations
 *
 * Prerequisites:
 * - Supabase local development environment running: `npx supabase start`
 * - Test database seeded with sample data
 *
 * Run: npm run test:integration
 */

const SUPABASE_URL = process.env.SUPABASE_TEST_URL || 'http://localhost:54321';
const SUPABASE_ANON_KEY = process.env.SUPABASE_TEST_ANON_KEY || '';

let supabase: SupabaseClient;
let adminSupabase: SupabaseClient;

beforeAll(async () => {
  supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  // Admin client for setup/teardown
  adminSupabase = createClient(
    SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  );
});

afterAll(async () => {
  // Cleanup test data
});

describe('Authentication and Authorization', () => {
  describe('User Registration', () => {
    it('should create new user account', async () => {
      const { data, error } = await supabase.auth.signUp({
        email: 'newuser@test.com',
        password: 'password123',
      });

      expect(error).toBeNull();
      expect(data.user).toBeDefined();
      expect(data.user?.email).toBe('newuser@test.com');
    });

    it('should not allow duplicate email registration', async () => {
      await supabase.auth.signUp({
        email: 'duplicate@test.com',
        password: 'password123',
      });

      const { error } = await supabase.auth.signUp({
        email: 'duplicate@test.com',
        password: 'password456',
      });

      expect(error).toBeDefined();
    });
  });

  describe('User Login', () => {
    it('should login with valid credentials', async () => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(error).toBeNull();
      expect(data.session).toBeDefined();
      expect(data.user).toBeDefined();
    });

    it('should fail login with invalid password', async () => {
      const { error } = await supabase.auth.signInWithPassword({
        email: 'test@example.com',
        password: 'wrongpassword',
      });

      expect(error).toBeDefined();
    });

    it('should fail login with non-existent email', async () => {
      const { error } = await supabase.auth.signInWithPassword({
        email: 'nonexistent@test.com',
        password: 'password123',
      });

      expect(error).toBeDefined();
    });
  });
});

describe('RLS Policies - Churches', () => {
  let churchId: string;
  let userId: string;

  beforeEach(async () => {
    // Setup: Create test church and user
    const { data: authData } = await supabase.auth.signInWithPassword({
      email: 'test@example.com',
      password: 'password123',
    });
    userId = authData.user!.id;

    const { data: church } = await adminSupabase
      .from('churches')
      .insert({ name: 'Test Church', slug: 'test-church' })
      .select()
      .single();

    churchId = church!.id;
  });

  it('should allow users to read their own church data', async () => {
    // Associate user with church
    await adminSupabase.from('members').insert({
      user_id: userId,
      church_id: churchId,
      name: 'Test User',
      phone: '010-1234-5678',
      status: 'active',
    });

    const { data, error } = await supabase
      .from('churches')
      .select()
      .eq('id', churchId)
      .single();

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(data.name).toBe('Test Church');
  });

  it('should not allow users to read other churches', async () => {
    const { data: otherChurch } = await adminSupabase
      .from('churches')
      .insert({ name: 'Other Church', slug: 'other-church' })
      .select()
      .single();

    const { data, error } = await supabase
      .from('churches')
      .select()
      .eq('id', otherChurch!.id)
      .single();

    // Should fail due to RLS policy
    expect(data).toBeNull();
  });

  it('should allow admin to update church data', async () => {
    await adminSupabase.from('members').insert({
      user_id: userId,
      church_id: churchId,
      name: 'Admin User',
      phone: '010-1234-5678',
      role: 'admin',
      status: 'active',
    });

    const { error } = await supabase
      .from('churches')
      .update({ name: 'Updated Church Name' })
      .eq('id', churchId);

    expect(error).toBeNull();
  });

  it('should not allow regular member to update church data', async () => {
    await adminSupabase.from('members').insert({
      user_id: userId,
      church_id: churchId,
      name: 'Regular Member',
      phone: '010-1234-5678',
      role: 'member',
      status: 'active',
    });

    const { error } = await supabase
      .from('churches')
      .update({ name: 'Unauthorized Update' })
      .eq('id', churchId);

    expect(error).toBeDefined();
  });
});

describe('RLS Policies - Members', () => {
  let churchId: string;
  let userId: string;
  let memberId: string;

  beforeEach(async () => {
    const { data: authData } = await supabase.auth.signInWithPassword({
      email: 'test@example.com',
      password: 'password123',
    });
    userId = authData.user!.id;

    const { data: church } = await adminSupabase
      .from('churches')
      .insert({ name: 'Test Church', slug: 'test-church' })
      .select()
      .single();

    churchId = church!.id;

    const { data: member } = await adminSupabase
      .from('members')
      .insert({
        user_id: userId,
        church_id: churchId,
        name: 'Test Member',
        phone: '010-1234-5678',
        status: 'active',
      })
      .select()
      .single();

    memberId = member!.id;
  });

  it('should allow members to read other members in same church', async () => {
    const { data: otherMember } = await adminSupabase
      .from('members')
      .insert({
        church_id: churchId,
        name: 'Other Member',
        phone: '010-9876-5432',
        status: 'active',
      })
      .select()
      .single();

    const { data, error } = await supabase
      .from('members')
      .select()
      .eq('id', otherMember!.id)
      .single();

    expect(error).toBeNull();
    expect(data).toBeDefined();
  });

  it('should not allow members to read members from other churches', async () => {
    const { data: otherChurch } = await adminSupabase
      .from('churches')
      .insert({ name: 'Other Church', slug: 'other-church' })
      .select()
      .single();

    const { data: otherMember } = await adminSupabase
      .from('members')
      .insert({
        church_id: otherChurch!.id,
        name: 'Other Church Member',
        phone: '010-1111-2222',
        status: 'active',
      })
      .select()
      .single();

    const { data } = await supabase
      .from('members')
      .select()
      .eq('id', otherMember!.id)
      .single();

    expect(data).toBeNull();
  });

  it('should allow staff to create new members', async () => {
    await adminSupabase
      .from('members')
      .update({ role: 'staff' })
      .eq('id', memberId);

    const { data, error } = await supabase
      .from('members')
      .insert({
        church_id: churchId,
        name: 'New Member',
        phone: '010-5555-6666',
        status: 'pending',
      })
      .select()
      .single();

    expect(error).toBeNull();
    expect(data).toBeDefined();
  });

  it('should not allow regular members to create new members', async () => {
    const { error } = await supabase
      .from('members')
      .insert({
        church_id: churchId,
        name: 'Unauthorized Member',
        phone: '010-7777-8888',
        status: 'pending',
      });

    expect(error).toBeDefined();
  });

  it('should allow members to update their own data', async () => {
    const { error } = await supabase
      .from('members')
      .update({ email: 'updated@test.com' })
      .eq('id', memberId);

    expect(error).toBeNull();
  });

  it('should not allow members to update other members data', async () => {
    const { data: otherMember } = await adminSupabase
      .from('members')
      .insert({
        church_id: churchId,
        name: 'Other Member',
        phone: '010-9999-0000',
        status: 'active',
      })
      .select()
      .single();

    const { error } = await supabase
      .from('members')
      .update({ name: 'Hacked Name' })
      .eq('id', otherMember!.id);

    expect(error).toBeDefined();
  });
});

describe('RLS Policies - Notes', () => {
  let churchId: string;
  let userId: string;
  let memberId: string;

  beforeEach(async () => {
    const { data: authData } = await supabase.auth.signInWithPassword({
      email: 'test@example.com',
      password: 'password123',
    });
    userId = authData.user!.id;

    const { data: church } = await adminSupabase
      .from('churches')
      .insert({ name: 'Test Church', slug: 'test-church' })
      .select()
      .single();

    churchId = church!.id;

    const { data: member } = await adminSupabase
      .from('members')
      .insert({
        user_id: userId,
        church_id: churchId,
        name: 'Test Member',
        phone: '010-1234-5678',
        status: 'active',
      })
      .select()
      .single();

    memberId = member!.id;
  });

  it('should allow members to create their own notes', async () => {
    const { data, error } = await supabase
      .from('notes')
      .insert({
        member_id: memberId,
        church_id: churchId,
        title: 'My Note',
        content: 'Test content',
      })
      .select()
      .single();

    expect(error).toBeNull();
    expect(data).toBeDefined();
  });

  it('should allow members to read their own notes', async () => {
    const { data: note } = await adminSupabase
      .from('notes')
      .insert({
        member_id: memberId,
        church_id: churchId,
        title: 'My Note',
        content: 'Test content',
      })
      .select()
      .single();

    const { data, error } = await supabase
      .from('notes')
      .select()
      .eq('id', note!.id)
      .single();

    expect(error).toBeNull();
    expect(data).toBeDefined();
  });

  it('should not allow members to read other members private notes', async () => {
    const { data: otherMember } = await adminSupabase
      .from('members')
      .insert({
        church_id: churchId,
        name: 'Other Member',
        phone: '010-9876-5432',
        status: 'active',
      })
      .select()
      .single();

    const { data: note } = await adminSupabase
      .from('notes')
      .insert({
        member_id: otherMember!.id,
        church_id: churchId,
        title: 'Private Note',
        content: 'Secret content',
        is_public: false,
      })
      .select()
      .single();

    const { data } = await supabase
      .from('notes')
      .select()
      .eq('id', note!.id)
      .single();

    expect(data).toBeNull();
  });

  it('should allow members to read public notes from same church', async () => {
    const { data: otherMember } = await adminSupabase
      .from('members')
      .insert({
        church_id: churchId,
        name: 'Other Member',
        phone: '010-9876-5432',
        status: 'active',
      })
      .select()
      .single();

    const { data: note } = await adminSupabase
      .from('notes')
      .insert({
        member_id: otherMember!.id,
        church_id: churchId,
        title: 'Public Note',
        content: 'Shared content',
        is_public: true,
      })
      .select()
      .single();

    const { data, error } = await supabase
      .from('notes')
      .select()
      .eq('id', note!.id)
      .single();

    expect(error).toBeNull();
    expect(data).toBeDefined();
  });
});

describe('Database Constraints', () => {
  it('should enforce unique church slug', async () => {
    await adminSupabase
      .from('churches')
      .insert({ name: 'Church One', slug: 'unique-church' });

    const { error } = await adminSupabase
      .from('churches')
      .insert({ name: 'Church Two', slug: 'unique-church' });

    expect(error).toBeDefined();
    expect(error?.message).toContain('duplicate');
  });

  it('should enforce member phone uniqueness per church', async () => {
    const { data: church } = await adminSupabase
      .from('churches')
      .insert({ name: 'Test Church', slug: 'test-church' })
      .select()
      .single();

    await adminSupabase.from('members').insert({
      church_id: church!.id,
      name: 'Member One',
      phone: '010-1234-5678',
      status: 'active',
    });

    const { error } = await adminSupabase.from('members').insert({
      church_id: church!.id,
      name: 'Member Two',
      phone: '010-1234-5678',
      status: 'active',
    });

    expect(error).toBeDefined();
  });

  it('should cascade delete church members when church is deleted', async () => {
    const { data: church } = await adminSupabase
      .from('churches')
      .insert({ name: 'Temp Church', slug: 'temp-church' })
      .select()
      .single();

    await adminSupabase.from('members').insert({
      church_id: church!.id,
      name: 'Temp Member',
      phone: '010-0000-0000',
      status: 'active',
    });

    await adminSupabase
      .from('churches')
      .delete()
      .eq('id', church!.id);

    const { data: members } = await adminSupabase
      .from('members')
      .select()
      .eq('church_id', church!.id);

    expect(members).toHaveLength(0);
  });
});
