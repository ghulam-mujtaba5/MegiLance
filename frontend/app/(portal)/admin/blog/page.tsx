'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { blogApi, BlogPost } from '@/lib/api/blog';
import Button from '@/app/components/Button/Button';
import Card from '@/app/components/Card/Card';
import Badge from '@/app/components/Badge/Badge';
import Modal from '@/app/components/Modal/Modal';
import Loader from '@/app/components/Loader/Loader';

import commonStyles from './AdminBlog.common.module.css';

export default function AdminBlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const data = await blogApi.getAll();
      setPosts(data);
    } catch (error) {
      console.error('Failed to fetch posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await blogApi.delete(id);
      setDeleteTargetId(null);
      fetchPosts();
    } catch (error) {
      console.error('Failed to delete post:', error);
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Blog & News Management</h1>
        <Link href="/admin/blog/create">
          <Button variant="primary">Create New Post</Button>
        </Link>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="p-4 font-semibold">Title</th>
                <th className="p-4 font-semibold">Author</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold">Type</th>
                <th className="p-4 font-semibold">Date</th>
                <th className="p-4 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {posts.map((post) => (
                <tr key={post.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="p-4">
                    <div className="font-medium">{post.title}</div>
                    <div className="text-sm text-gray-500 truncate max-w-xs">{post.slug}</div>
                  </td>
                  <td className="p-4">{post.author}</td>
                  <td className="p-4">
                    <Badge variant={post.is_published ? 'success' : 'warning'}>
                      {post.is_published ? 'Published' : 'Draft'}
                    </Badge>
                  </td>
                  <td className="p-4">
                    <Badge variant={post.is_news_trend ? 'info' : 'default'}>
                      {post.is_news_trend ? 'News Trend' : 'Article'}
                    </Badge>
                  </td>
                  <td className="p-4 text-sm text-gray-500">
                    {new Date(post.created_at).toLocaleDateString()}
                  </td>
                  <td className="p-4 space-x-2">
                    <Link href={`/admin/blog/${post.slug}`}>
                      <Button variant="outline" size="sm">Edit</Button>
                    </Link>
                    <Button variant="danger" size="sm" onClick={() => setDeleteTargetId(post.id)}>Delete</Button>
                  </td>
                </tr>
              ))}
              {posts.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500">
                    No posts found. Create one to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Delete Confirmation Modal */}
      {deleteTargetId && (
        <Modal isOpen onClose={() => setDeleteTargetId(null)} title="Delete Post">
          <p className={commonStyles.confirmText}>Are you sure you want to delete this post? This action cannot be undone.</p>
          <div className={commonStyles.modalActions}>
            <Button variant="secondary" size="sm" onClick={() => setDeleteTargetId(null)}>Cancel</Button>
            <Button variant="danger" size="sm" onClick={() => handleDelete(deleteTargetId)}>Delete</Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
