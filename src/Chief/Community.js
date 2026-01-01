import React, { useState, useEffect } from "react";
import "./style/Community.css";

const currentUser = {
  id: "U-001",
  name: "Dr. Ahmad",
  role: "doctor"
};

const Community = () => {
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ type: "", post: null });

  const [posts, setPosts] = useState([
    {
      id: "PUB-001",
      title: "Healthy Smoothie Recipes",
      content: "Here are some delicious and healthy smoothies to boost immunity.",
      category: "Diet",
      image: null,
      date: "2025-12-20",
      likes: 3,
      comments: []
    },
    {
      id: "PUB-002",
      title: "Meditation Tips",
      content: "Simple meditation exercises for mental well-being.",
      category: "Mental Health",
      image: null,
      date: "2025-12-18",
      likes: 5,
      comments: []
    },
    {
      id: "PUB-003",
      title: "Yoga Poses for Beginners",
      content: "Learn easy yoga poses you can do at home.",
      category: "Exercise",
      image: null,
      date: "2025-12-17",
      likes: 2,
      comments: []
    },
    {
      id: "PUB-004",
      title: "Boosting Immunity Naturally",
      content: "Tips on natural ways to strengthen your immune system.",
      category: "Diet",
      image: null,
      date: "2025-12-15",
      likes: 4,
      comments: []
    }
  ]);

  useEffect(() => {
    setTimeout(() => setLoading(false), 500);
  }, []);

  const filteredPosts = posts.filter(
    p =>
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.content.toLowerCase().includes(search.toLowerCase())
  );

  const openModal = (type, post = null) => setModal({ type, post });

  const handleAddPost = newPost => {
    setPosts([newPost, ...posts]);
    setModal({ type: "", post: null });
  };

  const handleLike = id => {
    setPosts(
      posts.map(p => (p.id === id ? { ...p, likes: p.likes + 1 } : p))
    );
  };

  const handleAddComment = (postId, text) => {
    setPosts(
      posts.map(p =>
        p.id === postId
          ? {
              ...p,
              comments: [
                ...p.comments,
                {
                  id: Date.now(),
                  text,
                  authorId: currentUser.id,
                  authorName: currentUser.name,
                  authorRole: currentUser.role,
                  timestamp: new Date().toISOString()
                }
              ]
            }
          : p
      )
    );
  };

  const handleDeleteComment = (postId, commentId) => {
    setPosts(
      posts.map(p =>
        p.id === postId
          ? { ...p, comments: p.comments.filter(c => c.id !== commentId) }
          : p
      )
    );
  };

  return (
    <div className="Community-page">
      <div className="Community-header">
        <div>
          <h1>Community Updates</h1>
          <p>Stay updated with the latest tips and announcements.</p>
        </div>
      </div>

      <div className="Community-actions">
        <input
          className="Community-search"
          type="text"
          placeholder="Search posts..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <button onClick={() => openModal("add")}>Add Post</button>
      </div>

      {loading ? (
        <p className="empty-state">Loading posts...</p>
      ) : filteredPosts.length === 0 ? (
        <p className="empty-state">No posts found.</p>
      ) : (
        <div className="Community-feed">
          {filteredPosts.map(post => (
            <div key={post.id} className="Post-card">
              {post.image && <img src={post.image} alt={post.title} />}
              <div className="Post-info">
                <span className="Post-category">{post.category}</span>
                <h3>{post.title}</h3>
                <p>{post.content}</p>
              </div>

              <div className="Post-actions">
                <span className="Post-date">{post.date}</span>
                <div className="Post-buttons">
                  <button
                    className="like-btn"
                    onClick={() => handleLike(post.id)}
                  >
                    👍 {post.likes} | 💬 {post.comments.length}
                  </button>
                  <button
                    className="view-btn"
                    onClick={() => openModal("view", post)}
                  >
                    View
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal.type === "add" && (
        <PostModal
          onSave={handleAddPost}
          onClose={() => openModal("", null)}
        />
      )}

      {modal.type === "view" && (
  <ViewPostModal
    // Find the latest version of the post from posts array
    post={posts.find(p => p.id === modal.post.id)}
    onClose={() => openModal("", null)}
    onAddComment={handleAddComment}
    onDeleteComment={handleDeleteComment}
  />
)}
    </div>
  );
};

/* ------------------ Post Modal ------------------ */
const PostModal = ({ onSave, onClose }) => {
  const [form, setForm] = useState({
    title: "",
    content: "",
    category: "Diet",
    image: null
  });

  const handleChange = e =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleImage = e =>
    setForm({ ...form, image: URL.createObjectURL(e.target.files[0]) });

  const savePost = () => {
    onSave({
      ...form,
      id: "PUB-" + Date.now(),
      date: new Date().toISOString().split("T")[0],
      likes: 0,
      comments: []
    });
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2>Add Post</h2>
        <input name="title" onChange={handleChange} placeholder="Title" />
        <textarea name="content" onChange={handleChange} placeholder="Content" />
        <select name="category" onChange={handleChange}>
          <option>Diet</option>
          <option>Exercise</option>
          <option>Mental Health</option>
          <option>Tips</option>
        </select>

        <label className="Attachment-wrapper">
          <input type="file" hidden accept="image/*" onChange={handleImage} />
          <span className="Attachment-btn">📎 Attach image</span>
        </label>

        <div className="modal-actions">
          <button onClick={savePost}>Add</button>
          <button onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
};

/* ------------------ View Post Modal ------------------ */
const ViewPostModal = ({ post, onClose, onAddComment, onDeleteComment }) => {
  const [comment, setComment] = useState("");

  const submit = () => {
    if (!comment.trim()) return;
    onAddComment(post.id, comment);
    setComment("");
  };

  return (
    <div className="modal-overlay">
      <div className="modal view-post-modal">
        <h2>{post.title}</h2>
        <span className="Post-category">{post.category}</span>
        <p>{post.content}</p>

        <div className="comments-section">
          <h4>Comments</h4>
          {post.comments.length === 0 && <p className="empty-state">No comments yet.</p>}

          {post.comments.map(c => (
            <div key={c.id} className="comment">
              <div className="comment-header">
                <strong>{c.authorName}</strong>
                <span className={`role ${c.authorRole}`}>{c.authorRole}</span>
              </div>
              <p>{c.text}</p>
              <div className="comment-footer">
                <small>{new Date(c.timestamp).toLocaleString()}</small>
                {c.authorId === currentUser.id && (
                  <button className="delete-comment" onClick={() => onDeleteComment(post.id, c.id)}>
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))}

          <textarea
            placeholder="Write a comment..."
            value={comment}
            onChange={e => setComment(e.target.value)}
          />
          <button onClick={submit}>Post Comment</button>
        </div>

        <div className="modal-actions">
          <button onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
};
export default Community;
