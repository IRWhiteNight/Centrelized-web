
import { useMemo, useState } from "react";
import {
    Search,
    Plus,
    Pencil,
    Trash2,
    Eye,
    EyeOff,
    ChevronDown,
    ChevronUp,
    ChevronRight,
    FolderOpen,
    MessageCircleQuestion,
    CheckCircle2,
    FileEdit,
    Layers,
    History,
    X,
    Save,
    ArrowUpDown,
    GripVertical,
    MoreHorizontal,
    ExternalLink,
    Clock3,
    Globe,
    Copy,
    AlertCircle,
    RotateCcw,
} from "lucide-react";

import "../../../css/admin-PSB-css/admin-faq.css";

/* ==========================================================
   SAMPLE DATA
   Replace with Laravel/Inertia props when backend is ready.
   ========================================================== */

const INITIAL_CATEGORIES = [
    { id: 1, title: "General Information", sort_order: 1 },
    { id: 2, title: "About Perlis Airspace Sandbox", sort_order: 2 },
    { id: 3, title: "Participation and Applications", sort_order: 3 },
    { id: 4, title: "Testing and Operations", sort_order: 4 },
    { id: 5, title: "Facilities and Infrastructure", sort_order: 5 },
];

const INITIAL_FAQS = [
    {
        id: 1,
        faq_category_id: 1,
        question: "What is the Perlis Airspace Sandbox?",
        answer:
            "The Perlis Airspace Sandbox is an initiative designed to provide a structured environment for testing, demonstrating and developing Unmanned Aircraft Systems (UAS) and related technologies. It supports innovation, collaboration and the development of the Malaysian drone ecosystem.",
        status: "published",
        sort_order: 1,
        updated_at: "2026-11-02",
    },
    {
        id: 2,
        faq_category_id: 1,
        question: "Where is the Perlis Airspace Sandbox located?",
        answer:
            "The Perlis Airspace Sandbox is located in Perlis, Malaysia. Detailed location information, access instructions and operational information are available on the Site Information page.",
        status: "published",
        sort_order: 2,
        updated_at: "2026-11-02",
    },
    {
        id: 3,
        faq_category_id: 2,
        question: "Why was Perlis selected for the sandbox?",
        answer:
            "Perlis provides opportunities to develop a dedicated environment for UAS innovation, research, testing and collaboration. Its strategic location and potential for aviation-related development make it a suitable location for the initiative.",
        status: "published",
        sort_order: 1,
        updated_at: "2026-11-01",
    },
    {
        id: 4,
        faq_category_id: 3,
        question: "Who can participate in the sandbox?",
        answer:
            "Participation may be open to drone operators, technology developers, researchers, universities, industry partners, government agencies and other relevant organisations, subject to programme requirements and applicable approvals.",
        status: "published",
        sort_order: 1,
        updated_at: "2026-11-02",
    },
    {
        id: 5,
        faq_category_id: 3,
        question: "How can I apply to participate?",
        answer:
            "Interested participants can submit an application through the Apply to Participate section of the Perlis Airspace Sandbox website. Applications will be reviewed according to the relevant programme requirements.",
        status: "published",
        sort_order: 2,
        updated_at: "2026-11-02",
    },
    {
        id: 6,
        faq_category_id: 4,
        question: "Do drone operations require approval?",
        answer:
            "Drone operations must comply with applicable aviation regulations, airspace requirements and operational approvals. Participants should refer to the relevant authorities and the sandbox operational guidelines before conducting any activities.",
        status: "published",
        sort_order: 1,
        updated_at: "2026-10-30",
    },
    {
        id: 7,
        faq_category_id: 5,
        question: "What facilities are available?",
        answer:
            "Information about available facilities, infrastructure and technical support will be provided through the Site Information and Services sections.",
        status: "draft",
        sort_order: 1,
        updated_at: "2026-11-03",
    },
];

const EMPTY_FORM = {
    id: null,
    faq_category_id: "",
    question: "",
    answer: "",
    status: "draft",
};

const getDate = () =>
    new Date().toLocaleDateString("en-MY", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });

export default function AdminPSBFAQ() {
    const [categories, setCategories] = useState(INITIAL_CATEGORIES);
    const [faqs, setFaqs] = useState(INITIAL_FAQS);
    const [trash, setTrash] = useState([]);
    const [history, setHistory] = useState([]);

    const [activeTab, setActiveTab] = useState("questions");
    const [activeCategory, setActiveCategory] = useState("all");
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [sortBy, setSortBy] = useState("order");

    const [editorOpen, setEditorOpen] = useState(false);
    const [categoryEditorOpen, setCategoryEditorOpen] = useState(false);
    const [previewOpen, setPreviewOpen] = useState(false);
    const [historyOpen, setHistoryOpen] = useState(false);

    const [editingFAQ, setEditingFAQ] = useState(null);
    const [editingCategory, setEditingCategory] = useState(null);
    const [form, setForm] = useState(EMPTY_FORM);
    const [categoryForm, setCategoryForm] = useState({ title: "" });
    const [expandedFAQ, setExpandedFAQ] = useState(null);
    const [previewFAQ, setPreviewFAQ] = useState(null);
    const [toast, setToast] = useState("");

    /* ---------- STATISTICS ---------- */

    const stats = useMemo(() => ({
        total: faqs.length,
        published: faqs.filter(x => x.status === "published").length,
        drafts: faqs.filter(x => x.status === "draft").length,
        categories: categories.length,
        trash: trash.length,
    }), [faqs, categories, trash]);

    /* ---------- FILTERING ---------- */

    const filteredFAQs = useMemo(() => {
        let result = [...faqs];

        if (activeCategory !== "all") {
            result = result.filter(
                x => String(x.faq_category_id) === String(activeCategory)
            );
        }

        if (statusFilter !== "all") {
            result = result.filter(x => x.status === statusFilter);
        }

        if (search.trim()) {
            const term = search.toLowerCase();

            result = result.filter(x => {
                const category = categories.find(
                    c => c.id === x.faq_category_id
                );

                return (
                    x.question.toLowerCase().includes(term) ||
                    x.answer.toLowerCase().includes(term) ||
                    category?.title.toLowerCase().includes(term)
                );
            });
        }

        if (sortBy === "newest") {
            result.sort((a, b) =>
                b.updated_at.localeCompare(a.updated_at)
            );
        } else if (sortBy === "oldest") {
            result.sort((a, b) =>
                a.updated_at.localeCompare(b.updated_at)
            );
        } else {
            result.sort((a, b) => a.sort_order - b.sort_order);
        }

        return result;
    }, [faqs, categories, activeCategory, statusFilter, search, sortBy]);

    /* ---------- HISTORY ---------- */

    const addHistory = (action, faq, detail = "") => {
        setHistory(prev => [
            {
                id: Date.now(),
                action,
                question: faq.question,
                detail,
                date: new Date().toLocaleString("en-MY"),
            },
            ...prev,
        ]);
    };

    const notify = (message) => {
        setToast(message);
        window.setTimeout(() => setToast(""), 3000);
    };

    /* ---------- FAQ EDITOR ---------- */

    const openCreateEditor = () => {
        setEditingFAQ(null);
        setForm({
            ...EMPTY_FORM,
            faq_category_id: categories[0]?.id || "",
        });
        setEditorOpen(true);
    };

    const openEditEditor = (faq) => {
        setEditingFAQ(faq);
        setForm({ ...faq });
        setEditorOpen(true);
    };

    const saveFAQ = (event) => {
        event.preventDefault();

        if (!form.question.trim() || !form.answer.trim()) {
            notify("Please complete the question and answer.");
            return;
        }

        if (!form.faq_category_id) {
            notify("Please select an FAQ category.");
            return;
        }

        if (editingFAQ) {
            const updated = {
                ...editingFAQ,
                ...form,
                faq_category_id: Number(form.faq_category_id),
                updated_at: new Date().toISOString().slice(0, 10),
            };

            setFaqs(prev =>
                prev.map(x => x.id === editingFAQ.id ? updated : x)
            );

            addHistory("Updated", updated, "FAQ content updated");
            notify("FAQ successfully updated.");
        } else {
            const newFAQ = {
                ...form,
                id: Date.now(),
                faq_category_id: Number(form.faq_category_id),
                sort_order:
                    faqs.filter(
                        x => x.faq_category_id === Number(form.faq_category_id)
                    ).length + 1,
                updated_at: new Date().toISOString().slice(0, 10),
            };

            setFaqs(prev => [...prev, newFAQ]);
            addHistory("Created", newFAQ, "New FAQ created");
            notify("New FAQ successfully created.");
        }

        setEditorOpen(false);
        setForm(EMPTY_FORM);
    };

    /* ---------- PUBLISH / UNPUBLISH ---------- */

    const togglePublish = (faq) => {
        const nextStatus =
            faq.status === "published" ? "draft" : "published";

        const updated = { ...faq, status: nextStatus };

        setFaqs(prev =>
            prev.map(x => x.id === faq.id ? updated : x)
        );

        addHistory(
            nextStatus === "published" ? "Published" : "Unpublished",
            faq,
            `Status changed to ${nextStatus}`
        );

        notify(
            nextStatus === "published"
                ? "FAQ published successfully."
                : "FAQ moved to draft."
        );
    };

    /* ---------- SOFT DELETE ---------- */

    const deleteFAQ = (faq) => {
        if (!window.confirm(
            "Move this FAQ to Trash? Super Admin can restore it later."
        )) return;

        setFaqs(prev => prev.filter(x => x.id !== faq.id));

        setTrash(prev => [
            ...prev,
            { ...faq, deleted_at: new Date().toISOString() },
        ]);

        addHistory("Deleted", faq, "Moved to Trash");
        notify("FAQ moved to Trash.");
    };

    const restoreFAQ = (faq) => {
        setTrash(prev => prev.filter(x => x.id !== faq.id));
        setFaqs(prev => [...prev, faq]);
        notify("FAQ restored.");
    };

    /* ---------- REORDER ---------- */

    const moveFAQ = (faq, direction) => {
        const group = faqs
            .filter(x => x.faq_category_id === faq.faq_category_id)
            .sort((a, b) => a.sort_order - b.sort_order);

        const index = group.findIndex(x => x.id === faq.id);
        const nextIndex = index + direction;

        if (nextIndex < 0 || nextIndex >= group.length) return;

        const first = group[index];
        const second = group[nextIndex];

        setFaqs(prev => prev.map(x => {
            if (x.id === first.id) {
                return { ...x, sort_order: second.sort_order };
            }
            if (x.id === second.id) {
                return { ...x, sort_order: first.sort_order };
            }
            return x;
        }));
    };

    /* ---------- CATEGORY MANAGEMENT ---------- */

    const openCategoryEditor = (category = null) => {
        setEditingCategory(category);
        setCategoryForm({
            title: category?.title || "",
        });
        setCategoryEditorOpen(true);
    };

    const saveCategory = (event) => {
        event.preventDefault();

        if (!categoryForm.title.trim()) {
            notify("Category title is required.");
            return;
        }

        if (editingCategory) {
            setCategories(prev =>
                prev.map(x =>
                    x.id === editingCategory.id
                        ? { ...x, title: categoryForm.title.trim() }
                        : x
                )
            );
            notify("Category updated.");
        } else {
            setCategories(prev => [
                ...prev,
                {
                    id: Date.now(),
                    title: categoryForm.title.trim(),
                    sort_order: prev.length + 1,
                },
            ]);
            notify("Category created.");
        }

        setCategoryEditorOpen(false);
    };

    const deleteCategory = (category) => {
        const hasQuestions = faqs.some(
            x => x.faq_category_id === category.id
        );

        if (hasQuestions) {
            notify("Move or delete the questions in this category first.");
            return;
        }

        if (!window.confirm(`Delete "${category.title}"?`)) return;

        setCategories(prev => prev.filter(x => x.id !== category.id));
        notify("Category deleted.");
    };

    const moveCategory = (category, direction) => {
        const sorted = [...categories].sort(
            (a, b) => a.sort_order - b.sort_order
        );

        const index = sorted.findIndex(x => x.id === category.id);
        const nextIndex = index + direction;

        if (nextIndex < 0 || nextIndex >= sorted.length) return;

        const first = sorted[index];
        const second = sorted[nextIndex];

        setCategories(prev => prev.map(x => {
            if (x.id === first.id) {
                return { ...x, sort_order: second.sort_order };
            }
            if (x.id === second.id) {
                return { ...x, sort_order: first.sort_order };
            }
            return x;
        }));
    };

    const getCategory = (id) =>
        categories.find(x => x.id === id)?.title || "Uncategorised";

    /* ======================================================
       RENDER
       ====================================================== */

    return (
        <div className="pf">

            {/* PAGE HEADING */}

            <div className="pf-heading">
                <div>
                    <div className="pf-eyebrow">
                        <span className="pf-eyebrow-dot" />
                        PSB CONTENT MANAGEMENT
                    </div>

                    <h1>Frequently Asked Questions</h1>

                    <p>
                        Manage FAQ categories, questions and answers
                        displayed on the Perlis Airspace Sandbox website.
                    </p>

                    <div className="pf-status-line">
                        <span className="pf-live-dot" />
                        <span>PSB Website</span>
                        <span className="pf-status-divider">/</span>
                        <span>FAQ Management</span>
                    </div>
                </div>

                <div className="pf-heading-actions">
                    <button
                        className="pf-btn pf-btn-outline"
                        onClick={() => setPreviewOpen(true)}
                    >
                        <Eye size={16} />
                        Public Preview
                    </button>

                    <button
                        className="pf-btn pf-btn-yellow"
                        onClick={openCreateEditor}
                    >
                        <Plus size={17} />
                        Add Question
                    </button>
                </div>
            </div>

            {/* STATISTICS */}

            <div className="pf-stats">
                <div className="pf-stat-card">
                    <div className="pf-stat-icon">
                        <MessageCircleQuestion size={19} />
                    </div>
                    <div>
                        <small>Total Questions</small>
                        <strong>{stats.total}</strong>
                        <span>Across all categories</span>
                    </div>
                </div>

                <div className="pf-stat-card">
                    <div className="pf-stat-icon is-published">
                        <CheckCircle2 size={19} />
                    </div>
                    <div>
                        <small>Published</small>
                        <strong>{stats.published}</strong>
                        <span>Visible on public website</span>
                    </div>
                </div>

                <div className="pf-stat-card">
                    <div className="pf-stat-icon is-draft">
                        <FileEdit size={19} />
                    </div>
                    <div>
                        <small>Drafts</small>
                        <strong>{stats.drafts}</strong>
                        <span>Not publicly visible</span>
                    </div>
                </div>

                <div className="pf-stat-card">
                    <div className="pf-stat-icon is-category">
                        <Layers size={19} />
                    </div>
                    <div>
                        <small>Categories</small>
                        <strong>{stats.categories}</strong>
                        <span>FAQ organisation</span>
                    </div>
                </div>
            </div>

            {/* CONTENT NAVIGATION */}

            <div className="pf-tabs">
                <button
                    className={activeTab === "questions" ? "is-active" : ""}
                    onClick={() => setActiveTab("questions")}
                >
                    <MessageCircleQuestion size={16} />
                    Questions & Answers
                    <span>{stats.total}</span>
                </button>

                <button
                    className={activeTab === "categories" ? "is-active" : ""}
                    onClick={() => setActiveTab("categories")}
                >
                    <FolderOpen size={16} />
                    Categories
                    <span>{stats.categories}</span>
                </button>

                <button
                    className={activeTab === "trash" ? "is-active" : ""}
                    onClick={() => setActiveTab("trash")}
                >
                    <Trash2 size={16} />
                    Trash
                    <span>{stats.trash}</span>
                </button>
            </div>

            {/* QUESTIONS TAB */}

            {activeTab === "questions" && (
                <>
                    <div className="pf-content-head">
                        <div>
                            <h2>Manage Questions</h2>
                            <p>
                                Create, edit, organise and publish
                                frequently asked questions.
                            </p>
                        </div>

                        <button
                            className="pf-btn pf-btn-yellow pf-btn-small"
                            onClick={openCreateEditor}
                        >
                            <Plus size={15} />
                            New FAQ
                        </button>
                    </div>

                    {/* CATEGORY FILTERS */}

                    <div className="pf-category-strip">
                        <button
                            className={activeCategory === "all" ? "is-active" : ""}
                            onClick={() => setActiveCategory("all")}
                        >
                            All Questions
                            <b>{stats.total}</b>
                        </button>

                        {categories.map(category => (
                            <button
                                key={category.id}
                                className={
                                    String(activeCategory) === String(category.id)
                                        ? "is-active"
                                        : ""
                                }
                                onClick={() => setActiveCategory(category.id)}
                            >
                                {category.title}
                                <b>
                                    {faqs.filter(
                                        x => x.faq_category_id === category.id
                                    ).length}
                                </b>
                            </button>
                        ))}
                    </div>

                    {/* TOOLBAR */}

                    <div className="pf-toolbar">
                        <div className="pf-search">
                            <Search size={17} />
                            <input
                                type="search"
                                placeholder="Search questions, answers or categories..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                            />
                            {search && (
                                <button onClick={() => setSearch("")}>
                                    <X size={15} />
                                </button>
                            )}
                        </div>

                        <select
                            value={statusFilter}
                            onChange={e => setStatusFilter(e.target.value)}
                        >
                            <option value="all">All statuses</option>
                            <option value="published">Published</option>
                            <option value="draft">Draft</option>
                        </select>

                        <select
                            value={sortBy}
                            onChange={e => setSortBy(e.target.value)}
                        >
                            <option value="order">Display order</option>
                            <option value="newest">Recently updated</option>
                            <option value="oldest">Oldest updated</option>
                        </select>
                    </div>

                    {/* FAQ LIST */}

                    <div className="pf-list-heading">
                        <span>
                            {filteredFAQs.length} QUESTIONS FOUND
                        </span>
                        <span>
                            <GripVertical size={13} />
                            Reorder using the arrows
                        </span>
                    </div>

                    <div className="pf-list">
                        {filteredFAQs.length === 0 ? (
                            <div className="pf-empty">
                                <MessageCircleQuestion size={34} />
                                <strong>No questions found</strong>
                                <p>
                                    Try changing your search or filters,
                                    or create a new FAQ.
                                </p>
                                <button
                                    className="pf-btn pf-btn-yellow pf-btn-small"
                                    onClick={openCreateEditor}
                                >
                                    <Plus size={15} />
                                    Add FAQ
                                </button>
                            </div>
                        ) : (
                            filteredFAQs.map((faq, index) => (
                                <article className="pf-item" key={faq.id}>
                                    <div className="pf-item-top">
                                        <div className="pf-item-number">
                                            {String(index + 1).padStart(2, "0")}
                                        </div>

                                        <div className="pf-item-content">
                                            <div className="pf-item-meta">
                                                <span className="pf-item-category">
                                                    {getCategory(faq.faq_category_id)}
                                                </span>

                                                <span
                                                    className={`pf-status-badge ${
                                                        faq.status === "published"
                                                            ? "is-published"
                                                            : "is-draft"
                                                    }`}
                                                >
                                                    {faq.status === "published"
                                                        ? "Published"
                                                        : "Draft"}
                                                </span>
                                            </div>

                                            <button
                                                className="pf-question"
                                                onClick={() =>
                                                    setExpandedFAQ(
                                                        expandedFAQ === faq.id
                                                            ? null
                                                            : faq.id
                                                    )
                                                }
                                            >
                                                {faq.question}
                                                <ChevronDown
                                                    size={18}
                                                    className={
                                                        expandedFAQ === faq.id
                                                            ? "is-rotated"
                                                            : ""
                                                    }
                                                />
                                            </button>

                                            <div className="pf-item-date">
                                                <Clock3 size={12} />
                                                Updated {faq.updated_at}
                                            </div>
                                        </div>

                                        <div className="pf-item-actions">
                                            <button
                                                title="Move up"
                                                onClick={() => moveFAQ(faq, -1)}
                                            >
                                                <ChevronUp size={16} />
                                            </button>

                                            <button
                                                title="Move down"
                                                onClick={() => moveFAQ(faq, 1)}
                                            >
                                                <ChevronDown size={16} />
                                            </button>

                                            <span className="pf-action-divider" />

                                            <button
                                                title="Preview"
                                                onClick={() => {
                                                    setPreviewFAQ(faq);
                                                    setPreviewOpen(true);
                                                }}
                                            >
                                                <Eye size={16} />
                                            </button>

                                            <button
                                                title="Edit"
                                                onClick={() => openEditEditor(faq)}
                                            >
                                                <Pencil size={16} />
                                            </button>

                                            <button
                                                title={
                                                    faq.status === "published"
                                                        ? "Unpublish"
                                                        : "Publish"
                                                }
                                                onClick={() => togglePublish(faq)}
                                            >
                                                {faq.status === "published"
                                                    ? <EyeOff size={16} />
                                                    : <Globe size={16} />}
                                            </button>

                                            <button
                                                className="is-danger"
                                                title="Move to Trash"
                                                onClick={() => deleteFAQ(faq)}
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>

                                    {expandedFAQ === faq.id && (
                                        <div className="pf-answer">
                                            <div className="pf-answer-label">
                                                ANSWER
                                            </div>
                                            <p>{faq.answer}</p>
                                            <button
                                                onClick={() => openEditEditor(faq)}
                                            >
                                                <Pencil size={13} />
                                                Edit answer
                                            </button>
                                        </div>
                                    )}
                                </article>
                            ))
                        )}
                    </div>
                </>
            )}

            {/* CATEGORIES TAB */}

            {activeTab === "categories" && (
                <>
                    <div className="pf-content-head">
                        <div>
                            <h2>FAQ Categories</h2>
                            <p>
                                Organise questions into categories
                                displayed on the public FAQ page.
                            </p>
                        </div>

                        <button
                            className="pf-btn pf-btn-yellow pf-btn-small"
                            onClick={() => openCategoryEditor()}
                        >
                            <Plus size={15} />
                            New Category
                        </button>
                    </div>

                    <div className="pf-category-list">
                        {[...categories]
                            .sort((a, b) => a.sort_order - b.sort_order)
                            .map((category, index) => {
                                const count = faqs.filter(
                                    x => x.faq_category_id === category.id
                                ).length;

                                return (
                                    <div className="pf-category-row" key={category.id}>
                                        <div className="pf-category-number">
                                            {String(index + 1).padStart(2, "0")}
                                        </div>

                                        <div className="pf-category-icon">
                                            <FolderOpen size={20} />
                                        </div>

                                        <div className="pf-category-info">
                                            <strong>{category.title}</strong>
                                            <small>
                                                {count} {count === 1 ? "question" : "questions"}
                                            </small>
                                        </div>

                                        <span className="pf-category-count">
                                            {count}
                                        </span>

                                        <div className="pf-item-actions">
                                            <button
                                                title="Move up"
                                                onClick={() => moveCategory(category, -1)}
                                            >
                                                <ChevronUp size={16} />
                                            </button>
                                            <button
                                                title="Move down"
                                                onClick={() => moveCategory(category, 1)}
                                            >
                                                <ChevronDown size={16} />
                                            </button>
                                            <button
                                                title="Edit"
                                                onClick={() => openCategoryEditor(category)}
                                            >
                                                <Pencil size={16} />
                                            </button>
                                            <button
                                                className="is-danger"
                                                title="Delete"
                                                onClick={() => deleteCategory(category)}
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                    </div>
                </>
            )}

            {/* TRASH TAB */}

            {activeTab === "trash" && (
                <>
                    <div className="pf-content-head">
                        <div>
                            <h2>Deleted FAQs</h2>
                            <p>
                                Items moved to Trash are retained for
                                Super Admin review and restoration.
                            </p>
                        </div>
                    </div>

                    <div className="pf-list">
                        {trash.length === 0 ? (
                            <div className="pf-empty">
                                <Trash2 size={34} />
                                <strong>Trash is empty</strong>
                                <p>Deleted FAQ items will appear here.</p>
                            </div>
                        ) : (
                            trash.map(faq => (
                                <div className="pf-trash-row" key={faq.id}>
                                    <div>
                                        <strong>{faq.question}</strong>
                                        <small>
                                            {getCategory(faq.faq_category_id)}
                                        </small>
                                    </div>
                                    <button
                                        className="pf-btn pf-btn-outline pf-btn-small"
                                        onClick={() => restoreFAQ(faq)}
                                    >
                                        <RotateCcw size={14} />
                                        Restore
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </>
            )}

            {/* FOOTER INFORMATION */}

            <div className="pf-footer">
                <div>
                    <span className="pf-live-dot" />
                    FAQ CONTENT MANAGEMENT
                </div>

                <span>
                    {stats.published} published · {stats.drafts} drafts
                </span>

                <button onClick={() => setHistoryOpen(true)}>
                    <History size={14} />
                    View history
                </button>
            </div>

            {/* FAQ EDITOR DRAWER */}

            {editorOpen && (
                <div
                    className="pf-overlay"
                    onMouseDown={e => {
                        if (e.target === e.currentTarget) setEditorOpen(false);
                    }}
                >
                    <form className="pf-drawer" onSubmit={saveFAQ}>
                        <div className="pf-drawer-head">
                            <div>
                                <span className="pf-eyebrow">
                                    FAQ CONTENT EDITOR
                                </span>
                                <h2>
                                    {editingFAQ ? "Edit Question" : "Create Question"}
                                </h2>
                                <p>
                                    Manage the question, answer and publishing status.
                                </p>
                            </div>
                            <button
                                type="button"
                                className="pf-close"
                                onClick={() => setEditorOpen(false)}
                            >
                                <X size={19} />
                            </button>
                        </div>

                        <div className="pf-drawer-body">
                            <div className="pf-form-section">
                                <span className="pf-form-label">01 / ORGANISATION</span>

                                <label>FAQ Category *</label>
                                <select
                                    required
                                    value={form.faq_category_id}
                                    onChange={e =>
                                        setForm(prev => ({
                                            ...prev,
                                            faq_category_id: e.target.value,
                                        }))
                                    }
                                >
                                    <option value="">Select a category</option>
                                    {categories.map(category => (
                                        <option
                                            key={category.id}
                                            value={category.id}
                                        >
                                            {category.title}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="pf-form-section">
                                <span className="pf-form-label">02 / QUESTION</span>

                                <label>Question *</label>
                                <input
                                    required
                                    maxLength={400}
                                    placeholder="Enter the frequently asked question..."
                                    value={form.question}
                                    onChange={e =>
                                        setForm(prev => ({
                                            ...prev,
                                            question: e.target.value,
                                        }))
                                    }
                                />
                                <small>
                                    {form.question.length}/400 characters
                                </small>
                            </div>

                            <div className="pf-form-section">
                                <span className="pf-form-label">03 / ANSWER</span>

                                <label>Answer *</label>
                                <textarea
                                    required
                                    rows={10}
                                    placeholder="Write a clear and informative answer..."
                                    value={form.answer}
                                    onChange={e =>
                                        setForm(prev => ({
                                            ...prev,
                                            answer: e.target.value,
                                        }))
                                    }
                                />
                                <small>
                                    Plain text answer. Rich text support can
                                    be added later.
                                </small>
                            </div>

                            <div className="pf-form-section">
                                <span className="pf-form-label">04 / PUBLISHING</span>

                                <label>Content Status</label>

                                <div className="pf-status-options">
                                    <button
                                        type="button"
                                        className={
                                            form.status === "draft"
                                                ? "is-active"
                                                : ""
                                        }
                                        onClick={() =>
                                            setForm(prev => ({
                                                ...prev,
                                                status: "draft",
                                            }))
                                        }
                                    >
                                        <FileEdit size={16} />
                                        <span>
                                            <strong>Draft</strong>
                                            <small>Not publicly visible</small>
                                        </span>
                                    </button>

                                    <button
                                        type="button"
                                        className={
                                            form.status === "published"
                                                ? "is-active"
                                                : ""
                                        }
                                        onClick={() =>
                                            setForm(prev => ({
                                                ...prev,
                                                status: "published",
                                            }))
                                        }
                                    >
                                        <Globe size={16} />
                                        <span>
                                            <strong>Published</strong>
                                            <small>Visible on website</small>
                                        </span>
                                    </button>
                                </div>
                            </div>

                            <div className="pf-editor-note">
                                <AlertCircle size={17} />
                                <p>
                                    Published FAQs will be available on the
                                    public PSB FAQ page after the backend
                                    publishing workflow is connected.
                                </p>
                            </div>
                        </div>

                        <div className="pf-drawer-foot">
                            <button
                                type="button"
                                className="pf-btn pf-btn-outline"
                                onClick={() => setEditorOpen(false)}
                            >
                                Cancel
                            </button>

                            <button
                                type="submit"
                                className="pf-btn pf-btn-yellow"
                            >
                                <Save size={16} />
                                {editingFAQ ? "Save Changes" : "Create FAQ"}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* CATEGORY EDITOR */}

            {categoryEditorOpen && (
                <div
                    className="pf-overlay"
                    onMouseDown={e => {
                        if (e.target === e.currentTarget) {
                            setCategoryEditorOpen(false);
                        }
                    }}
                >
                    <form
                        className="pf-modal"
                        onSubmit={saveCategory}
                    >
                        <div className="pf-modal-head">
                            <div className="pf-dialog-icon">
                                <FolderOpen size={22} />
                            </div>
                            <button
                                type="button"
                                className="pf-close"
                                onClick={() => setCategoryEditorOpen(false)}
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <h2>
                            {editingCategory
                                ? "Edit Category"
                                : "Create Category"}
                        </h2>

                        <p>
                            Categories help visitors navigate
                            frequently asked questions.
                        </p>

                        <label>Category Name *</label>
                        <input
                            required
                            maxLength={150}
                            placeholder="e.g. General Information"
                            value={categoryForm.title}
                            onChange={e =>
                                setCategoryForm({ title: e.target.value })
                            }
                        />

                        <div className="pf-modal-actions">
                            <button
                                type="button"
                                className="pf-btn pf-btn-outline"
                                onClick={() => setCategoryEditorOpen(false)}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="pf-btn pf-btn-yellow"
                            >
                                <Save size={15} />
                                Save Category
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* PUBLIC PREVIEW */}

            {previewOpen && (
                <div
                    className="pf-overlay pf-preview-overlay"
                    onMouseDown={e => {
                        if (e.target === e.currentTarget) {
                            setPreviewOpen(false);
                            setPreviewFAQ(null);
                        }
                    }}
                >
                    <div className="pf-preview-window">
                        <div className="pf-preview-topbar">
                            <div>
                                <Eye size={17} />
                                <strong>PUBLIC FAQ PREVIEW</strong>
                            </div>
                            <button
                                className="pf-close"
                                onClick={() => {
                                    setPreviewOpen(false);
                                    setPreviewFAQ(null);
                                }}
                            >
                                <X size={19} />
                            </button>
                        </div>

                        <div className="pf-public-preview">
                            <div className="pf-public-eyebrow">
                                PERLIS AIRSPACE SANDBOX
                            </div>
                            <h2>
                                Frequently Asked <em>Questions</em>
                            </h2>
                            <p>
                                Find answers to common questions about
                                the Perlis Airspace Sandbox.
                            </p>

                            {previewFAQ ? (
                                <div className="pf-public-category">
                                    <h3>{getCategory(previewFAQ.faq_category_id)}</h3>
                                    <article>
                                        <strong>{previewFAQ.question}</strong>
                                        <p>{previewFAQ.answer}</p>
                                    </article>
                                </div>
                            ) : (
                                categories.map(category => {
                                    const items = faqs
                                        .filter(x =>
                                            x.faq_category_id === category.id &&
                                            x.status === "published"
                                        )
                                        .sort((a, b) => a.sort_order - b.sort_order);

                                    if (!items.length) return null;

                                    return (
                                        <div
                                            className="pf-public-category"
                                            key={category.id}
                                        >
                                            <h3>{category.title}</h3>

                                            {items.map(faq => (
                                                <article key={faq.id}>
                                                    <strong>{faq.question}</strong>
                                                    <p>{faq.answer}</p>
                                                </article>
                                            ))}
                                        </div>
                                    );
                                })
                            )}

                            <div className="pf-public-contact">
                                <strong>Still have questions?</strong>
                                <p>
                                    Contact the Perlis Airspace Sandbox
                                    team for further assistance.
                                </p>
                                <span>Contact Us <ChevronRight size={14} /></span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* HISTORY DRAWER */}

            {historyOpen && (
                <div
                    className="pf-overlay"
                    onMouseDown={e => {
                        if (e.target === e.currentTarget) setHistoryOpen(false);
                    }}
                >
                    <div className="pf-drawer pf-history-drawer">
                        <div className="pf-drawer-head">
                            <div>
                                <span className="pf-eyebrow">
                                    CONTENT AUDIT
                                </span>
                                <h2>FAQ History</h2>
                                <p>
                                    Recent changes recorded in this session.
                                </p>
                            </div>
                            <button
                                className="pf-close"
                                onClick={() => setHistoryOpen(false)}
                            >
                                <X size={19} />
                            </button>
                        </div>

                        <div className="pf-drawer-body">
                            {history.length === 0 ? (
                                <div className="pf-empty">
                                    <History size={32} />
                                    <strong>No activity yet</strong>
                                    <p>
                                        FAQ changes will appear here.
                                    </p>
                                </div>
                            ) : (
                                history.map(item => (
                                    <div className="pf-history-row" key={item.id}>
                                        <span className="pf-history-dot" />
                                        <div>
                                            <strong>{item.action}</strong>
                                            <p>{item.question}</p>
                                            <small>
                                                {item.detail} · {item.date}
                                            </small>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* TOAST */}

            {toast && (
                <div className="pf-toast">
                    <CheckCircle2 size={18} />
                    {toast}
                    <button onClick={() => setToast("")}>
                        <X size={15} />
                    </button>
                </div>
            )}

        </div>
    );
}
