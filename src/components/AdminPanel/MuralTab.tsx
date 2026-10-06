import React, { useState, useRef } from 'react';
import { useData } from '../../context/DataContext';
import { Megaphone, Pin, Trash2, MessageCircle, Image, Link as LinkIcon, ExternalLink, X, Send } from 'lucide-react';
import { Post } from '../../types';
import { compressImageFile } from '../../utils/storage';

interface MuralTabProps {
  currentAdminName: string;
}

export const MuralTab: React.FC<MuralTabProps> = ({ currentAdminName }) => {
  const { data, addPost, togglePinPost, deletePost, showToast } = useData();
  const [content, setContent] = useState('');
  const [link, setLink] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [replyPostId, setReplyPostId] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      showToast('Imagem muito grande (máximo 15MB)', 'error');
      return;
    }

    try {
      setIsProcessingImage(true);
      const compressedDataUrl = await compressImageFile(file, 1000, 0.75);
      setImagePreview(compressedDataUrl);
      showToast('✓ Imagem otimizada e anexada!');
    } catch (err: any) {
      showToast(err.message || 'Erro ao processar imagem', 'error');
    } finally {
      setIsProcessingImage(false);
    }
  };

  const handleAddLink = () => {
    const url = prompt('Cole o endereço do link (ex: https://site.com):');
    if (!url || !url.trim()) return;

    let fullUrl = url.trim();
    if (!fullUrl.match(/^https?:\/\//i)) {
      fullUrl = 'https://' + fullUrl;
    }

    try {
      new URL(fullUrl);
      setLink(fullUrl);
      showToast('✓ Link adicionado!');
    } catch {
      showToast('URL inválida. Exemplo: https://google.com', 'error');
    }
  };

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && !imagePreview && !link) {
      showToast('Escreva uma mensagem ou anexe uma mídia para publicar.', 'error');
      return;
    }

    setIsPublishing(true);
    try {
      const success = await addPost({
        content: content.trim(),
        authorId: 'admin',
        authorName: currentAdminName || 'Coordenação',
        authorType: 'admin',
        isPinned: true,
        link: link || undefined,
        image: imagePreview || undefined
      });

      if (success) {
        setContent('');
        setLink('');
        setImagePreview(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    } finally {
      setIsPublishing(false);
    }
  };

  const handleSendReply = (parentId: string) => {
    if (!replyContent.trim()) {
      showToast('Escreva sua resposta antes de enviar.', 'error');
      return;
    }

    addPost({
      content: replyContent.trim(),
      authorId: 'admin',
      authorName: currentAdminName || 'Coordenação',
      authorType: 'admin',
      isPinned: false,
      parentId
    });

    setReplyContent('');
    setReplyPostId(null);
  };

  // Group root posts and replies
  const rootPosts = data.posts
    .filter(p => !p.post_parent_id)
    .sort((a, b) => {
      if (a.post_is_pinned && !b.post_is_pinned) return -1;
      if (!a.post_is_pinned && b.post_is_pinned) return 1;
      return new Date(b.post_created_at).getTime() - new Date(a.post_created_at).getTime();
    });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Create Announcement Card */}
      <div className="bg-white rounded-2xl p-6 shadow-xs border border-zinc-200">
        <h3 className="font-bold text-base text-zinc-900 flex items-center gap-2 mb-3">
          <Megaphone className="w-5 h-5 text-indigo-600" />
          <span>Publicar Comunicado no Mural</span>
        </h3>

        <form onSubmit={handlePublish} className="space-y-3">
          <textarea
            rows={3}
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="Escreva um aviso para alunos e professores..."
            className="w-full px-4 py-3 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-zinc-50/50 text-zinc-900 placeholder:text-zinc-400 resize-none"
          />

          {/* Attachments Preview */}
          {(imagePreview || link) && (
            <div className="p-3 rounded-xl bg-indigo-50/50 border border-indigo-100 space-y-2">
              {imagePreview && (
                <div className="relative inline-block">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="max-h-48 rounded-lg border border-indigo-200 object-contain bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setImagePreview(null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-md hover:bg-rose-700 transition"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {link && (
                <div className="flex items-center justify-between p-2 rounded-lg bg-white border border-indigo-100 text-xs">
                  <div className="flex items-center gap-2 truncate">
                    <LinkIcon className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                    <span className="text-zinc-700 font-medium truncate">{link}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setLink('')}
                    className="text-rose-600 hover:text-rose-800 p-1 flex-shrink-0"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-200 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 transition"
              >
                <Image className="w-4 h-4 text-indigo-600" />
                <span>Adicionar Foto</span>
              </button>

              <button
                type="button"
                onClick={handleAddLink}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-200 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 transition"
              >
                <LinkIcon className="w-4 h-4 text-indigo-600" />
                <span>Adicionar Link</span>
              </button>
            </div>

            <button
              type="submit"
              disabled={isProcessingImage || isPublishing}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-xs transition active:scale-95"
            >
              <Pin className="w-3.5 h-3.5" />
              <span>{isProcessingImage ? 'Processando imagem...' : isPublishing ? 'Publicando...' : 'Publicar Aviso'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Feed List */}
      <div className="space-y-4">
        {rootPosts.length > 0 ? (
          rootPosts.map(post => {
            const replies = data.posts.filter(p => p.post_parent_id === post.entity_id);

            return (
              <div
                key={post.entity_id}
                className={`p-5 rounded-2xl border transition ${
                  post.post_is_pinned
                    ? 'bg-amber-50/40 border-amber-200 shadow-xs'
                    : 'bg-white border-zinc-200 shadow-xs'
                }`}
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                      post.post_author_type === 'admin'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-zinc-100 text-zinc-800'
                    }`}>
                      {post.post_author_type === 'admin' ? 'ADM' : 'ALU'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-zinc-900">
                          {post.post_author_name}
                        </span>
                        {post.post_is_pinned && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                            <Pin className="w-3 h-3 text-amber-700" />
                            Fixado
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-zinc-400">
                        {new Date(post.post_created_at).toLocaleString('pt-BR')}
                      </span>
                    </div>
                  </div>

                  {/* Admin controls: Pin & Delete */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => togglePinPost(post.entity_id)}
                      className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition ${
                        post.post_is_pinned
                          ? 'bg-amber-200/80 text-amber-900 hover:bg-amber-300'
                          : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                      }`}
                      title={post.post_is_pinned ? 'Desafixar Aviso' : 'Fixar Aviso no topo'}
                    >
                      <Pin className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('Deseja remover esta publicação do mural?')) {
                          deletePost(post.entity_id);
                        }
                      }}
                      className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition"
                      title="Excluir Post"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Content */}
                <p className="text-sm text-zinc-800 whitespace-pre-wrap leading-relaxed mb-3">
                  {post.post_content}
                </p>

                {/* Media Image */}
                {post.post_image && (
                  <div className="mb-3">
                    <img
                      src={post.post_image}
                      alt="Anexo"
                      className="max-h-72 rounded-xl border border-zinc-200 object-contain bg-zinc-50"
                    />
                  </div>
                )}

                {/* Attached Link */}
                {post.post_link && (
                  <div className="mb-3 p-3 rounded-xl bg-zinc-50 border border-zinc-200 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 truncate">
                      <ExternalLink className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                      <a
                        href={post.post_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-600 hover:underline font-semibold truncate"
                      >
                        {post.post_link}
                      </a>
                    </div>
                  </div>
                )}

                {/* Reply action */}
                <div className="pt-2 border-t border-zinc-100 flex items-center justify-between">
                  <button
                    onClick={() => {
                      setReplyPostId(replyPostId === post.entity_id ? null : post.entity_id);
                      setReplyContent('');
                    }}
                    className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>Responder ({replies.length})</span>
                  </button>
                </div>

                {/* Reply Form */}
                {replyPostId === post.entity_id && (
                  <div className="mt-3 pt-3 border-t border-zinc-100 flex gap-2">
                    <input
                      type="text"
                      value={replyContent}
                      onChange={e => setReplyContent(e.target.value)}
                      placeholder="Escreva uma resposta..."
                      className="flex-1 px-3.5 py-1.5 rounded-xl border border-zinc-200 text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          handleSendReply(post.entity_id);
                        }
                      }}
                    />
                    <button
                      onClick={() => handleSendReply(post.entity_id)}
                      className="px-3.5 py-1.5 rounded-xl bg-indigo-600 text-white font-semibold text-xs hover:bg-indigo-700 flex items-center gap-1 transition"
                    >
                      <Send className="w-3 h-3" />
                      <span>Enviar</span>
                    </button>
                  </div>
                )}

                {/* Nested Replies List */}
                {replies.length > 0 && (
                  <div className="mt-3 pl-4 border-l-2 border-indigo-200 space-y-2">
                    {replies.map(reply => (
                      <div key={reply.entity_id} className="p-2.5 rounded-xl bg-zinc-50 border border-zinc-100 text-xs">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-zinc-900">{reply.post_author_name}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-zinc-400">
                              {new Date(reply.post_created_at).toLocaleString('pt-BR')}
                            </span>
                            <button
                              onClick={() => deletePost(reply.entity_id)}
                              className="text-rose-500 hover:text-rose-700"
                              title="Excluir resposta"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                        <p className="text-zinc-700 whitespace-pre-wrap">{reply.post_content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="text-center py-12 text-zinc-400 bg-white rounded-2xl border border-zinc-200">
            <Megaphone className="w-12 h-12 mx-auto mb-3 opacity-30 text-zinc-400" />
            <p className="text-sm font-medium text-zinc-600">Nenhum comunicado no mural ainda.</p>
            <p className="text-xs text-zinc-400 mt-1">Publique um aviso acima para alunos e professores.</p>
          </div>
        )}
      </div>
    </div>
  );
};
