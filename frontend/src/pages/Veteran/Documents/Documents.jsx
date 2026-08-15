import React, { useState, useEffect, useRef } from 'react';
import {
  FileText,
  UploadCloud,
  FileCheck2,
  Trash2,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  File,
  X,
  Clock,
  ShieldCheck,
  FolderOpen,
  RefreshCw,
  Info,
} from 'lucide-react';
import { documentService } from '../../../services/documentService.js';
import { useSocket } from '../../../context/SocketContext.jsx';
import PageContainer from '../../../components/PageContainer/PageContainer.jsx';
import Button from '../../../components/Button/Button.jsx';
import Input from '../../../components/Input/Input.jsx';
import Badge from '../../../components/Badge/Badge.jsx';
import EmptyState from '../../../components/EmptyState/EmptyState.jsx';
import LoadingSpinner from '../../../components/LoadingSpinner/LoadingSpinner.jsx';
import ErrorMessage from '../../../components/ErrorMessage/ErrorMessage.jsx';
import './Documents.css';

const DOCUMENT_TYPES = [
  'Service Certificate',
  'Discharge Certificate',
  'Identity Document',
  'Pension Document',
  'Education Certificate',
  'Skill Certificate',
  'Experience Certificate',
  'Address Proof',
  'Other',
];

export const Documents = () => {
  const { on, off } = useSocket();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Upload Form State
  const [documentType, setDocumentType] = useState('Service Certificate');
  const [documentName, setDocumentName] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);

  // Replacement State for Rejected Documents
  const [replacingDoc, setReplacingDoc] = useState(null);
  const replaceFileInputRef = useRef(null);

  const loadDocuments = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await documentService.getDocuments();
      if (data && data.documents) {
        setDocuments(data.documents);
      }
    } catch (err) {
      setError(err.message || 'Failed to load uploaded documents');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, []);

  // Real-time synchronization when Admin updates document status
  useEffect(() => {
    const handleStatusChanged = (data) => {
      console.log('[Real-Time] Document status update received:', data);
      loadDocuments();
    };

    on('document:statusChanged', handleStatusChanged);
    on('admin:verificationUpdated', handleStatusChanged);
    on('notification:new', handleStatusChanged);

    return () => {
      off('document:statusChanged', handleStatusChanged);
      off('admin:verificationUpdated', handleStatusChanged);
      off('notification:new', handleStatusChanged);
    };
  }, [on, off]);

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // File format check
    const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type) && !/\.(pdf|jpg|jpeg|png|webp)$/i.test(file.name)) {
      setError('Unsupported file format. Please choose a verified PDF, JPG, JPEG, PNG, or WEBP document.');
      return;
    }

    // Size check (10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('Selected file exceeds the maximum 10 MB size limit.');
      return;
    }

    setSelectedFile(file);
    if (!documentName.trim()) {
      setDocumentName(file.name.replace(/\.[^/.]+$/, ''));
    }
    setError('');
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setError('Please select a document file to upload');
      return;
    }

    setError('');
    setSuccessMsg('');
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('documentType', documentType);
      formData.append('documentName', documentName.trim() || selectedFile.name);

      const res = await documentService.uploadDocument(formData);
      if (res && res.document) {
        setSuccessMsg(`Document "${res.document.documentName}" uploaded successfully and submitted for scrutiny!`);
        setSelectedFile(null);
        setDocumentName('');
        if (fileInputRef.current) fileInputRef.current.value = '';
        await loadDocuments();
      }
    } catch (err) {
      setError(err.message || 'File upload failed. Please verify format and try again.');
    } finally {
      setUploading(false);
    }
  };

  // Replace Rejected / Existing Document Handler
  const handleReplaceFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !replacingDoc) return;

    // File format check
    const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type) && !/\.(pdf|jpg|jpeg|png|webp)$/i.test(file.name)) {
      setError('Unsupported format. Please select a PDF, JPG, PNG, or WEBP document.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('Selected file exceeds 10 MB size limit.');
      return;
    }

    setUploading(true);
    setError('');
    setSuccessMsg('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('documentName', replacingDoc.documentName);
      formData.append('documentType', replacingDoc.documentType);

      const res = await documentService.replaceDocument(replacingDoc.id || replacingDoc._id, formData);
      if (res && res.document) {
        setSuccessMsg(`Replacement document "${res.document.documentName}" uploaded successfully and queued for review.`);
        setReplacingDoc(null);
        if (replaceFileInputRef.current) replaceFileInputRef.current.value = '';
        await loadDocuments();
      }
    } catch (err) {
      setError(err.message || 'Failed to replace document.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (docId, docTitle) => {
    if (!window.confirm(`Are you sure you want to permanently delete "${docTitle}"?`)) {
      return;
    }

    setError('');
    setSuccessMsg('');
    try {
      await documentService.deleteDocument(docId);
      setSuccessMsg(`Document deleted successfully.`);
      setDocuments(documents.filter((d) => (d.id || d._id) !== docId));
    } catch (err) {
      setError(err.message || 'Failed to delete document');
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 KB';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'VERIFIED':
        return <Badge variant="success" icon={ShieldCheck}>Verified</Badge>;
      case 'UNDER_REVIEW':
        return <Badge variant="warning" icon={Clock}>Under Review</Badge>;
      case 'REJECTED':
        return <Badge variant="danger" icon={AlertTriangle}>Rejected</Badge>;
      case 'PENDING':
      case 'UPLOADED':
      default:
        return <Badge variant="neutral" icon={FileCheck2}>Pending Scrutiny</Badge>;
    }
  };

  return (
    <PageContainer width="wide">
      <div className="documents-page-wrapper">
        <div className="documents-header">
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-primary-950)', marginBottom: '4px' }}>
            Supporting Documents Vault
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9375rem' }}>
            Securely upload, store, and verify official defense discharge certificates, pension documents, and identity records for welfare eligibility.
          </p>
        </div>

        <ErrorMessage message={error} />
        {successMsg && (
          <div style={{ backgroundColor: 'var(--color-success-bg)', border: '1px solid var(--color-success-border)', color: 'var(--color-success)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
            <CheckCircle2 size={18} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Hidden replacement file picker */}
        <input
          type="file"
          ref={replaceFileInputRef}
          onChange={handleReplaceFileSelect}
          accept=".pdf,.jpg,.jpeg,.png,.webp"
          style={{ display: 'none' }}
        />

        <div className="documents-grid-layout">
          {/* Column 1: Document Upload Card */}
          <div className="upload-card">
            <h2 className="upload-card-title">Upload New Document</h2>
            <p className="upload-card-desc">
              Supported formats: PDF, JPG, PNG, WEBP (Max size: 10 MB)
            </p>

            <form onSubmit={handleUploadSubmit}>
              <Input
                label="Document Classification"
                as="select"
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value)}
                required
              >
                {DOCUMENT_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </Input>

              <Input
                label="Document Title (Optional)"
                value={documentName}
                onChange={(e) => setDocumentName(e.target.value)}
                placeholder="e.g. Army Discharge Book Page 1-3"
              />

              {/* Hidden File Input & Custom Dropzone */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept=".pdf,.jpg,.jpeg,.png,.webp"
                style={{ display: 'none' }}
                id="doc-file-input"
              />

              {!selectedFile ? (
                <div
                  className="drop-zone"
                  onClick={() => fileInputRef.current?.click()}
                  role="button"
                  tabIndex={0}
                >
                  <div className="drop-zone-icon">
                    <UploadCloud size={24} />
                  </div>
                  <div className="drop-zone-text">Click to choose document</div>
                  <div className="drop-zone-hint">PDF or high-resolution scan (up to 10MB)</div>
                </div>
              ) : (
                <div className="selected-file-preview">
                  <div className="file-info-col">
                    <File size={20} color="var(--color-primary-800)" />
                    <div>
                      <div className="file-name-text">{selectedFile.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-slate-500)' }}>
                        {formatFileSize(selectedFile.size)}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFile(null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-slate-500)' }}
                  >
                    <X size={16} />
                  </button>
                </div>
              )}

              <Button
                type="submit"
                variant="accent"
                size="md"
                fullWidth
                loading={uploading}
                disabled={!selectedFile}
                icon={UploadCloud}
              >
                Upload & Secure Document
              </Button>
            </form>
          </div>

          {/* Column 2: Uploaded Documents Library */}
          <div className="documents-list-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-primary-900)' }}>
                Your Uploaded Records ({documents.length})
              </h2>
            </div>

            {loading ? (
              <LoadingSpinner size="md" message="Retrieving confidential records..." />
            ) : documents.length === 0 ? (
              <EmptyState
                icon={FolderOpen}
                title="No documents uploaded yet"
                description="Upload your military discharge book, service certificate, PPO, or ID proof using the form on the left to complete your profile verification."
              />
            ) : (
              <div className="documents-table-wrapper">
                <table className="documents-table">
                  <thead>
                    <tr>
                      <th>Document</th>
                      <th>Category</th>
                      <th>Date</th>
                      <th>Status & Remarks</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {documents.map((doc) => {
                      const docId = doc.id || doc._id;
                      const isRejected = doc.verificationStatus === 'REJECTED';
                      const remark = doc.rejectionReason || doc.adminRemarks;

                      return (
                        <tr key={docId} style={isRejected ? { backgroundColor: '#fef2f2' } : {}}>
                          <td>
                            <div className="doc-name-cell">
                              <div className="doc-icon-box">
                                <FileText size={18} />
                              </div>
                              <div>
                                <div className="doc-title-text">{doc.documentName}</div>
                                <div className="doc-type-text">{formatFileSize(doc.fileSize)}</div>
                              </div>
                            </div>
                          </td>
                          <td>
                            <span style={{ fontWeight: 600, color: 'var(--color-slate-700)' }}>
                              {doc.documentType}
                            </span>
                          </td>
                          <td style={{ color: 'var(--color-slate-600)', fontSize: '0.8125rem' }}>
                            {doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString() : 'Recent'}
                          </td>
                          <td>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              <div>{getStatusBadge(doc.verificationStatus)}</div>
                              {remark && (
                                <div
                                  style={{
                                    fontSize: '0.75rem',
                                    color: isRejected ? '#dc2626' : '#64748b',
                                    fontWeight: isRejected ? 600 : 400,
                                    lineHeight: 1.3,
                                    maxWidth: '220px',
                                  }}
                                >
                                  {isRejected ? `Reason: ${remark}` : `Remark: ${remark}`}
                                </div>
                              )}
                            </div>
                          </td>
                          <td>
                            <div className="doc-actions-cell">
                              {/* Secure View */}
                              <a
                                href={documentService.getDocumentViewUrl(docId, doc.fileUrl)}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="View Document File"
                              >
                                <Button variant="secondary" size="sm" icon={ExternalLink} style={{ padding: '0.35rem 0.5rem' }}>
                                  View
                                </Button>
                              </a>

                              {/* Upload Again / Replace if rejected */}
                              {isRejected && (
                                <Button
                                  variant="primary"
                                  size="sm"
                                  icon={RefreshCw}
                                  onClick={() => {
                                    setReplacingDoc(doc);
                                    replaceFileInputRef.current?.click();
                                  }}
                                  style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem' }}
                                  title="Upload clear copy"
                                >
                                  Replace
                                </Button>
                              )}

                              {/* Delete Document */}
                              <Button
                                variant="danger"
                                size="sm"
                                icon={Trash2}
                                onClick={() => handleDelete(docId, doc.documentName)}
                                style={{ padding: '0.35rem 0.5rem' }}
                                title="Delete Document"
                              />
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </PageContainer>
  );
};

export default Documents;
