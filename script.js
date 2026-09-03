const root = document.documentElement;
const storageKeys = {
  theme: "resume-theme",
  lang: "resume-lang",
  contrast: "resume-contrast",
};

const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
const savedTheme = localStorage.getItem(storageKeys.theme);
const routeLanguage = location.pathname.match(/^\/(en|ar)(?:\/|$)/)?.[1];
const savedLang =
  routeLanguage ||
  localStorage.getItem(storageKeys.lang) ||
  (navigator.languages?.some((language) =>
    language.toLowerCase().startsWith("ar"),
  )
    ? "ar"
    : "en");
const savedContrast = localStorage.getItem(storageKeys.contrast) || "normal";

const controls = {
  themeToggle: document.querySelector(".theme-toggle"),
  langToggle: document.querySelector(".lang-toggle"),
  contrastToggle: document.querySelector(".contrast-toggle"),
};

const metaNodes = {
  description: document.getElementById("meta-description"),
  themeColor: document.querySelector('meta[name="theme-color"]'),
  ogTitle: document.getElementById("og-title"),
  ogDescription: document.getElementById("og-description"),
  twitterTitle: document.getElementById("twitter-title"),
  twitterDescription: document.getElementById("twitter-description"),
  personSchema: document.getElementById("person-schema"),
};

const copyToast =
  document.querySelector(".copy-toast") || document.createElement("div");
let toastTimer = 0;

copyToast.setAttribute("role", "status");
copyToast.setAttribute("aria-live", "polite");
copyToast.setAttribute("aria-atomic", "true");

if (!copyToast.isConnected) {
  copyToast.className = "copy-toast";
  document.body.appendChild(copyToast);
}

const siteMeta = {
  url: "https://creativemahdy.space/",
  image: "https://creativemahdy.space/assets/ahmed-mahdy.png",
  email: "mailto:amahdy59@gmail.com",
  sameAs: [
    "https://www.linkedin.com/in/creativemahdy",
    "https://dribbble.com/creativemahdy",
  ],
  knowsAbout: [
    "UX Design",
    "Data Visualization",
    "Data Analytics",
    "Power BI",
    "Tableau",
    "Microsoft Excel",
    "SQL",
    "Python",
  ],
};

const translations = {
  ar: {
    about_text:
      "مصمم تجربة مستخدم ومصور بيانات بخبرة تزيد عن 8 سنوات في تحويل احتياجات المستخدمين والأعمال إلى لوحات معلومات تفاعلية وتجارب رقمية متمحورة حول المستخدم. ماهر في أبحاث المستخدم، وبنية المعلومات، وسرد البيانات، وتصميم الواجهات سهلة الوصول باستخدام Excel وPower BI وTableau وSQL وPython.",
    aria_dark_mode: "الوضع الداكن",
    aria_high_contrast_mode: "وضع التباين العالي",
    aria_switch_to_arabic: "التبديل إلى العربية",
    aria_switch_to_english: "التبديل إلى الإنجليزية",
    cert1: "تحليل البيانات من جوجل (Google Data Analytics)",
    cert1_meta: "جوجل · 2024",
    cert2_meta: "شريك التعلّم Tableau · 2024",
    cert3_meta: "جامعة ماكواري · 2024",
    cert4_meta: "جامعة ماكواري · 2024",
    cert5_meta: "جوجل · 2023",
    cert1_desc: "بناء مهارات جاهزة لسوق العمل في تنظيف البيانات والتحليل والتصوير المرئي واتخاذ القرارات المستندة إلى البيانات.",
    cert2_desc: "إثبات الكفاءة في Tableau للاتصال والتحليل والتصوير المرئي ومشاركة البيانات لدعم رؤى الأعمال.",
    cert3_desc: "مهارات Excel المتقدمة لتحليل البيانات والنمذجة والتصوير المرئي والأتمتة باستخدام الصيغ والجداول المحورية.",
    cert4_desc: "إتقان Excel الموجه للأعمال يشمل إدارة البيانات والصيغ المتقدمة وإعداد التقارير الاحترافية.",
    cert5_desc: "أساسيات تصميم تجربة المستخدم تشمل أبحاث المستخدم والتخطيط الهيكلي والنماذج الأولية واختبار قابلية الاستخدام.",
    certs_subtitle: "شهادات مهنية تُثبت خبرتي والتزامي بالتعلم المستمر.",
    certs_count_label: "شهادات",
    cert2: "تحليل ذكاء الأعمال Tableau (Tableau Business Intelligence Analyst)",
    cert3: "مهارات Excel لتحليل البيانات والتصوير المرئي",
    cert4: "مهارات Excel للأعمال",
    cert5: "تصميم تجربة المستخدم من جوجل (Google UX Design)",
    back_to_top: "العودة إلى الأعلى",
    control_contrast: "التباين",
    control_language: "English",
    control_theme: "المظهر",
    contact_dribbble: "معرض دريبل",
    contact_linkedin: "لينكد إن",
    contact_links_label: "روابط التواصل",
    data_tag: "تصوير البيانات",
    display_settings_label: "إعدادات العرض",
    edu1_badge: "دبلوم",
    edu1_date: "سبتمبر 2016 - يونيو 2017",
    edu1_desc: "تخصص في التصميم التعليمي ومنهجيات التعلم الإلكتروني وحلول تكنولوجيا التعليم.",
    edu1_school: "معهد تكنولوجيا المعلومات (ITI)",
    edu1_title: "دبلوم في تقنيات التعليم وتكنولوجيا المعلومات",
    edu2_badge: "بكالوريوس",
    edu2_date: "سبتمبر 2009 - يونيو 2013",
    edu2_desc: "دراسة الاتصال الإذاعي والإنتاج الإعلامي والسرد البصري.",
    edu2_school: "جامعة المنوفية",
    edu2_title: "بكالوريوس في الإذاعة والتلفزيون",
    exp_tag: "خبرة +8 سنوات",
    footer_cta: "لنعمل معاً",
    footer_email: "راسل أحمد",
    footer_text:
      "هل تبحث عن خبرة في تجربة المستخدم، أو المنتجات سهلة الوصول، أو تجارب البيانات الداعمة للقرار؟",
    featured_work: "أعمال مختارة",
    more_projects: "مشاريع إضافية",
    hero_actions_label: "إجراءات ملف الأعمال والتواصل",
    external_site_hint: "يفتح في موقع خارجي",
    highlights_label: "أبرز النقاط",
    job1_b1:
      "قيادة تصميم تجربة وواجهة المستخدم (UX/UI) لمنصات (SaaS) المؤسسية و(B2B) المعقدة، وتقديم حلول تتمحور حول المستخدم.",
    job1_b2:
      "تأسيس أنظمة تصميم قابلة للتوسع باستخدام Figma وAdobe Creative Suite والمنهجيات الحديثة.",
    job1_b3:
      "الاستفادة من أدوات التصميم المدعومة بالذكاء الاصطناعي لتسريع النماذج الأولية وتلخيص أبحاث تجربة المستخدم.",
    job1_company: "أدفانسيز للحلول البرمجية",
    job1_company_desc: "شركة رائدة في حلول تكنولوجيا المعلومات متخصصة في البرمجيات المؤسسية والتحول الرقمي وتكامل الأنظمة في منطقة الشرق الأوسط وشمال أفريقيا.",
    job1_date: "يناير 2023 - الحالي · 3 سنوات و6 أشهر",
    job1_date_range: "يناير 2023 – الحالي",
    job1_duration: "3 سنوات و6 أشهر",
    job1_location: "القاهرة، مصر",
    job1_type: "دوام كامل",
    job1_title: "مصمم تجربة المستخدم",
    job1_impact1_metric: "أنظمة التصميم",
    job1_impact1_label: "مكونات قابلة للتوسع",
    job1_impact1_desc: "تأسيس أنظمة تصميم قابلة للتوسع باستخدام Figma والمنهجيات الحديثة لمنصات B2B.",
    job1_impact2_metric: "تجربة مؤسسية",
    job1_impact2_label: "منصات SaaS معقدة",
    job1_impact2_desc: "قيادة تصميم UX/UI لمنصات SaaS المؤسسية وB2B المعقدة مع حلول متمحورة حول المستخدم.",
    job1_impact3_metric: "ذكاء اصطناعي",
    job1_impact3_label: "نماذج أولية سريعة",
    job1_impact3_desc: "الاستفادة من أدوات التصميم بالذكاء الاصطناعي لتسريع سير عمل النماذج الأولية وتلخيص أبحاث UX.",
    key_impact: "الأثر الرئيسي",
    jobs_subtitle: "أماكن عملي والأثر الذي قدمته",
    job2_b1:
      "إعادة تصميم منصات وواجهات التعلم المؤسسية، مما زاد من تفاعل المستخدمين ومعدلات إكمال التدريب بنسبة 30%.",
    job2_b2:
      "تحويل المتطلبات التقنية المعقدة إلى تجارب تعلم إلكترونية B2B سهلة الوصول وبديهية.",
    job2_company: "شنايدر إلكتريك",
    job2_company_desc: "شركة عالمية رائدة في إدارة الطاقة والأتمتة، تقود التحول الرقمي عبر الحلول المؤسسية والصناعية.",
    job2_date: "يوليو 2018 - يناير 2023 · 4 سنوات و7 أشهر",
    job2_date_range: "يوليو 2018 – يناير 2023",
    job2_duration: "4 سنوات و7 أشهر",
    job2_location: "القاهرة، مصر",
    job2_type: "دوام كامل",
    job2_title: "مصمم تعليمي",
    job2_impact1_metric: "+30%",
    job2_impact1_label: "إكمال الدورات",
    job2_impact1_desc: "إعادة تصميم منصات التعلم المؤسسية وواجهاتها، مما زاد من التفاعل ومعدلات الإكمال.",
    job2_impact2_metric: "حلول قابلة للتوسع",
    job2_impact2_label: "منصات تعلم عالمية",
    job2_impact2_desc: "بناء أصول وقوالب تعلم قابلة لإعادة الاستخدام والتوسع لتبسيط تقديم المحتوى.",
    job2_impact3_metric: "تركيز على المتعلم",
    job2_impact3_label: "تصميم قائم على النتائج",
    job2_impact3_desc: "تطبيق علوم التعلم ومبادئ UX لإنشاء تجارب مؤثرة تتمحور حول المتعلم.",
    main_resume_label: "محتوى السيرة الذاتية الرئيسي",
    meta_description:
      "السيرة الذاتية لأحمد مهدي، مصمم تجربة مستخدم ومصور بيانات، مع خبرة في التصميم، ولوحات المعلومات، وتجارب المنتجات الرقمية.",
    meta_title: "أحمد مهدي | مصمم تجربة المستخدم ومصور بيانات",
    name: "أحمد مهدي",
    opens_new_tab: " يفتح في تبويب جديد",
    profile_details_label: "تفاصيل الملف الشخصي",
    proj_data1_desc:
      "تجربة تفاعلية لتصور البيانات باستخدام Tableau تساعد المستخدمين على استكشاف مجموعات LEGO حسب الموضوع، والعمر، والسعر، وعدد القطع.",
    proj_data1_title: "مستكشف ليجو المعتمد على البيانات",
    proj_data2_desc:
      "لوحة معلومات لمبيعات علاقات العملاء (CRM) تم بناؤها في Google Sheets لتتبع أداء الفريق الربع سنوي عبر التصور المعتمد على الرسوم البيانية.",
    proj_data2_title: "لوحة معلومات أداء المبيعات",
    proj_data_header: "مشاريع تحليل وتصوير البيانات",
    proj_ux1_desc:
      "تصور متجاوب يركز على الخصوصية لأداة موارد بشرية (SaaS) تدعم طلبات الإجازات والموافقات حسب الدور ووضوح حالة الطلب.",
    proj_ux1_title: "أداة الموارد البشرية",
    proj_ux2_desc:
      "تصور تفاعلي للوحة تحكم تشغيلية يركز على وضوح تصوير البيانات وتسلسل المعلومات والسلوك المتجاوب.",
    proj_ux2_title: "مركز التحكم بمطار القاهرة الدولي",
    proj_ux3_desc:
      "تصور لتجارة إلكترونية عبر الجوال يسهل الوصول إليه، مع تنقل يبدأ بالبحث وتجربة دفع موحدة للزوار.",
    proj_ux3_title: "تطبيق حاج عرفة",
    proj_ux4_desc:
      "تطبيق عربي أولاً وسهل الوصول للأذكار ومواقيت الصلاة، مع دعم العمل دون اتصال وقراءة هادئة وتقدم واضح.",
    proj_ux4_title: "تطبيق الأذكار - الحصن اليومي",
    proj_ux_header: "مشاريع تجربة المستخدم",
    print_resume_action: "طباعة / حفظ PDF",
    read_case_study: "قراءة دراسة الحالة",
    resume_card_label: "نظرة عامة على السيرة الذاتية",
    resume_label: "موقع السيرة الذاتية لأحمد مهدي",
    section_nav_label: "أقسام السيرة الذاتية",
    sect_about: "نبذة عني",
    sect_certs: "الشهادات المهنية",
    sect_edu: "التعليم",
    sect_jobs: "الخبرات المهنية",
    sect_projects: "المشاريع",
    sect_skills: "المهارات",
    skill_data1: "إكسل (متقدم)",
    skill_data2: "باور بي آي (Power BI)",
    skill_data3: "تابلو (Tableau)",
    skill_data4: "بايثون (Python)",
    skill_data5: "لغة الاستعلامات (SQL)",
    skill_data6: "تصميم لوحات المعلومات",
    skill_data7: "سرد البيانات قصصياً",
    skill_data8: "تحليل مؤشرات الأداء (KPI)",
    skill_ux1: "تصميم التفاعل",
    skill_ux10: "تصميم المؤسسات ومنتجات SaaS",
    skill_ux11: "حزمة Adobe الإبداعية",
    skill_ux12: "أدوات التصميم بالذكاء الاصطناعي",
    skill_ux2: "بنية المعلومات",
    skill_ux3: "أبحاث المستخدمين",
    skill_ux4: "اختبار سهولة الاستخدام",
    skill_ux5: "التخطيط الهيكلي (Wireframing)",
    skill_ux6: "بناء النماذج الأولية",
    skill_ux7: "فيجما (Figma)",
    skill_ux8: "أنظمة التصميم",
    skill_ux9: "سهولة الوصول (a11y)",
    skills_data_header: "تحليل وتصوير البيانات",
    skills_data_desc: "تحويل البيانات إلى رؤى ذات معنى وقصص بصرية مؤثرة.",
    skills_ux_header: "تصميم تجربة المستخدم",
    skills_ux_desc: "تصميم واجهات بديهية وتجارب سلسة تحل مشاكل المستخدمين والأعمال.",
    skills_tools_header: "الأدوات والتقنيات",
    skills_tools_desc: "التقنيات التي أستخدمها للتصميم والتحليل وبناء النماذج وتقديم حلول قائمة على البيانات.",
    skills_subtitle: "مزيج من التفكير التصميمي وخبرة البيانات والأدوات الحديثة لبناء تجارب رقمية واضحة.",
    skills_tagline: "أتعلم باستمرار وأستكشف أدوات جديدة",
    skill_level_proficient: "إتقان",
    skill_level_advanced: "متقدم",
    skill_level_expert: "خبير",
    skill_tool1: "مايكروسوفت 365",
    skill_tool2: "جوجل Workspace",
    skill_tool3: "Looker Studio",
    skill_tool4: "Git و GitHub",
    skip_link: "تجاوز إلى محتوى السيرة الذاتية",
    title: "مصمم تجربة المستخدم ومصور بيانات",
    hero_cta_work: "عرض أبرز المشاريع",
    hero_cta_print: "طباعة / حفظ السيرة الذاتية",
    hero_value:
      "أحوّل المنتجات المعقدة والبيانات إلى تجارب واضحة وسهلة الوصول، مستفيداً من خبرتي في التعلم الإلكتروني وإنتاج الفيديو.",
    view_selected_work: "عرض أبرز الأعمال",
    project_owner_ux: "أحمد مهدي · مصمم تجربة المستخدم",
    project_owner_data: "أحمد مهدي · تصميم UX وتصوير البيانات",
    project_type_independent: "مشروع مستقل",
    project_status_live: "تنفيذ تفاعلي مباشر",
    project_disclosure:
      "جميع مشاريع تجربة المستخدم من تصميم أحمد مهدي في Figma. استُخدمت أدوات Antigravity وCodex وClaude للمساعدة في تحويل التصاميم إلى تطبيقات حية تحت مراجعته وتوجيهه.",
    toast_copied: "تم النسخ",
    hero_bio:
      "أساعد الشركات في تحويل البيانات المعقدة إلى رؤى واضحة وتجارب رقمية متميزة يحب الناس استخدامها.",
    hero_cta_resume: "تحميل السيرة الذاتية",
    hero_availability: "متاح لمشاريع جديدة",
    contact_email_sub: "بريد محمي",
    contact_li_sub: "الملف المهني",
    contact_dr_sub: "معرض الأعمال",
    tooltip_contrast: "تبديل التباين العالي",
    tooltip_copy_cert: "نسخ رابط الشهادة",
    tooltip_copy_dribbble: "نسخ رابط دريبل",
    tooltip_copy_email: "نسخ البريد الإلكتروني",
    tooltip_copy_linkedin: "نسخ رابط لينكد إن",
    tooltip_copy_project: "نسخ رابط المشروع",
    tooltip_send_email: "إرسال بريد إلكتروني",
    tooltip_lang: "تبديل اللغة",
    tooltip_theme_dark: "التبديل إلى الوضع الداكن",
    tooltip_theme_light: "التبديل إلى الوضع الفاتح",
    tooltip_visit_live_site: "زيارة الموقع المباشر",
    ux_tag: "تصميم تجربة المستخدم",
    visit_live_project: "عرض المشروع الحي",
    collapse_project: "طي",
    expand_project: "توسيع",

    // Case Study Shared UI
    cs_back_to_projects: "العودة إلى المشاريع",
    cs_home: "الرئيسية",
    cs_projects: "المشاريع",
    cs_listen: "استمع",
    cs_pause: "إيقاف مؤقت",
    cs_hide_preview: "إخفاء المعاينة التفاعلية",
    cs_image_preview: "معاينة الصورة",
    cs_close_image_preview: "إغلاق معاينة الصورة",
    cs_zoom_image: "تكبير الصورة",
    print_portfolio_title: "أحمد مهدي — ملف الأعمال التفاعلي ودراسات الحالة",
    print_scan_online: "امسح للعرض عبر الإنترنت",
    cs_role: "الدور",
    cs_timeline: "المدة",
    cs_platform: "المنصة",
    cs_status: "الحالة",
    cs_interactive_preview: "معاينة تفاعلية",
    cs_visit_live: "زيارة المشروع الحي",
    cs_visit_dashboard: "فتح لوحة البيانات",
    cs_desktop: "سطح المكتب",
    cs_mobile: "الجوال (390px)",
    cs_open_tab: "فتح في نافذة جديدة",
    cs_key_decision: "قرار التصميم الرئيسي",
    cs_prev_project: "المشروع السابق",
    cs_next_project: "المشروع التالي",
    cs_sec1_title: "01 السياق والتحدي",
    cs_sec2_title: "02 المنهجية والقرارات الرئيسية",
    cs_sec3_title: "03 الأدوات والتقنيات",
    cs_sec4_title: "04 النتائج والأثر",
    cs_sec5_title: "05 الأدلة والتحقق المستقبلي",
    cs_sec6_title: "06 الملكية وما تعلمته",
    cs_provenance_ownership: "الملكية",
    cs_provenance_ownership_desc:
      "صمم أحمد مهدي تجربة المستخدم، وبنية المعلومات، والتوجه البصري، والمحتوى، واتخذ القرارات النهائية للمشروع.",
    cs_provenance_background: "المنظور المهني",
    cs_provenance_background_desc:
      "استفاد العمل من خبرته في تصميم تجربة المستخدم ومن خلفيته في التعلم الإلكتروني وإنتاج الفيديو لتبسيط المعلومات وتوضيح التسلسل والسرد.",
    cs_provenance_ai: "التنفيذ بمساعدة الذكاء الاصطناعي",
    cs_provenance_ai_desc:
      "حوّل أحمد تصاميم Figma إلى مشروع حي بمساعدة وكلاء Antigravity وCodex وClaude، ثم راجع التنفيذ وصقله واختبره.",
    cs_provenance_evidence: "حدود الأدلة",
    cs_provenance_evidence_desc:
      "المتاح هو التصميم والتنفيذ الحي وقرارات دراسة الحالة. لا تُنسب نتائج أعمال كمية ما لم يوجد مصدر وقياس موثق.",
    cs_haj_learning:
      "التعلم الخاص: تصميم مسار تجارة إلكترونية قصير ومتجاوب، وتوجيه وكلاء الذكاء الاصطناعي لتنفيذ حالات التنقل والدفع بدقة.",
    cs_cairo_learning:
      "التعلم الخاص: الحفاظ على هرمية المعلومات والوضوح البصري عند تحويل لوحة تشغيل كثيفة البيانات من Figma إلى تجربة حية.",
    cs_hr_learning:
      "التعلم الخاص: نمذجة مسارات العمل القائمة على الأدوار وحالات الموافقة، ومراجعة المخرجات المولدة بالذكاء الاصطناعي من منظور سهولة الوصول.",
    cs_azkar_learning:
      "التعلم الخاص: حماية أولوية العربية واتجاه RTL وجودة القراءة أثناء استخدام الوكلاء لتنفيذ تجربة حساسة للمحتوى.",
    cs_lego_learning:
      "التعلم الخاص: تحويل استكشاف البيانات إلى قصة بصرية تفاعلية، واختيار الأداة أو الوكيل الأنسب لكل مهمة بدلاً من الاعتماد على أداة واحدة.",

    // Case Study 1: Haj Arafa App
    cs_haj_title: "تطبيق حاج عرفة",
    cs_haj_badge: "تجارة رقمية عبر الجوال • تجربة مستخدم المتجر",
    cs_haj_sub:
      "واجهة متجر إلكتروني مصممة للجوال أولاً تتميز بتنقل قائم على البحث وتجربة دفع سريعة من خطوتين.",
    cs_haj_role: "مصمم تجربة المستخدم",
    cs_haj_timeline: "3 أشهر",
    cs_haj_platform: "تطبيق ويب للجوال",
    cs_haj_status: "تنفيذ تفاعلي مباشر",
    cs_haj_sec1_desc:
      "ركز موجز التصميم على تبسيط تصنيفات الجوال المتشعبة ومسار دفع طويل كان يتطلب إنشاء حساب.",
    cs_haj_sec2_desc:
      "تم تخطيط رحلة التسوق المقصودة وتصميم تنقل يركز على البحث، ودفع للزائر، وأهداف لمس بارزة بقياس 44 بكسل مسترشدة بمعايير WCAG 2.2 ذات الصلة.",
    cs_haj_sec2_callout:
      "جُمعت خمس مراحل للواجهة في مفهوم دفع واحد قائم على الأكورديون مع إكمال العنوان وتفصيل واضح للتكلفة.",
    cs_haj_sec4_desc:
      "تم تقديم تنفيذ حي ومتجاوب بمسار أقصر وأوضح من استكشاف المنتج إلى تأكيد الطلب.",
    cs_haj_sec5_desc:
      "يوضح التنفيذ الحي الرحلة المقترحة. لم تُقَس نتائج التحويل أو التخلي عن السلة بعد، وتتطلب تحليلات إنتاج تحترم الخصوصية.",

    // Case Study 2: Cairo International Airport - Command Hub
    cs_cairo_title: "مطار القاهرة الدولي - مركز التحكم والعمليات",
    cs_cairo_badge: "العمليات والطيران • لوحة معلومات Tableau",
    cs_cairo_sub:
      "تصور للوحة قيادة وتحكم تشغيلية ينظم مؤشرات المدارج ودقة المواعيد والخدمات الأرضية في عرض متجاوب واحد.",
    cs_cairo_role: "مصمم تجربة المستخدم ومصور البيانات",
    cs_cairo_timeline: "4 أشهر",
    cs_cairo_platform: "Tableau Desktop و Cloud",
    cs_cairo_status: "تنفيذ تفاعلي مباشر",
    cs_cairo_sec1_desc:
      "كان تحدي التصميم هو توحيد مؤشرات الأمتعة ودوران الطائرات وازدحام البوابات في واجهة واحدة سريعة المسح لمديري المحطات.",
    cs_cairo_sec2_desc:
      "نُظمت اللوحة في مربعات بصرية واضحة مع تصفية تفاعلية للحدود، مع تمثيل SQL وTableau ضمن مسار البيانات المقترح.",
    cs_cairo_sec2_callout:
      "صُمم نمط تحذير لوني قابل للضبط لإظهار مخاطر دوران الطائرات قبل أن تصبح حرجة.",
    cs_cairo_sec4_desc:
      "تم تقديم تنفيذ حي للوحة يوضح هرمية العمليات وتفاعلات دعم القرار المقترحة.",
    cs_cairo_sec5_desc:
      "التنفيذ الحي هو الدليل المتاح. لم يُقَس التبني التشغيلي أو أثر زمن الاستجابة بصورة مستقلة.",

    // Case Study 3: HR Management Tool
    cs_hr_title: "منظومة إدارة الموارد البشرية",
    cs_hr_badge: "تجربة مستخدم مؤسسية • تصميم منصة SaaS",
    cs_hr_sub:
      "منصة شاملة لإدارة القوى العاملة تعمل على تبسيط طلبات الإجازات ومراجعات الأداء وجداول نوبات الأقسام.",
    cs_hr_role: "مصمم تجربة المستخدم",
    cs_hr_timeline: "4 أشهر",
    cs_hr_platform: "تطبيق ويب سحابي (SaaS)",
    cs_hr_status: "تنفيذ تفاعلي مباشر",
    cs_hr_sec1_desc:
      "تناول موجز التصميم النماذج المبعثرة، وسلاسل الموافقة عبر البريد، ومحدودية رؤية أرصدة الإجازات.",
    cs_hr_sec2_desc:
      "صُممت لوحات مرنة مع طلبات خدمة ذاتية، وتوجيه للموافقات حسب الأدوار، وجداول تقويمية سهلة الوصول.",
    cs_hr_sec2_callout:
      "أُنشئ مفهوم نافذة مراجعة مجمعة لاعتماد تعديلات الجداول المتكررة من عرض واحد مركز.",
    cs_hr_sec4_desc:
      "صُمم مسار الخدمة الذاتية والموافقات لتقليل التأخير وتحسين وضوح حالة الطلب، ويتطلب قياس الأثر الفعلي بيانات إنتاج موثقة.",
    cs_hr_sec5_desc:
      "يوضح التنفيذ الحي مسار العمل. يتطلب إثبات التبني في الإنتاج أو الوقت الموفر بيانات مؤسسية موثقة.",

    // Case Study 4: Azkar Application
    cs_azkar_title: "تطبيق الأذكار اليومية",
    cs_azkar_badge: "تجربة مستخدم الجوال • تطبيقات الإنتاجية الإسلامية",
    cs_azkar_sub:
      "تطبيق إسلامي سهل الوصول ويعمل دون اتصال بالإنترنت، يقدم تتبعاً يومياً للأذكار ومسبحة إلكترونية تفاعلية سلسة.",
    cs_azkar_role: "مصمم تجربة المستخدم",
    cs_azkar_timeline: "شهران",
    cs_azkar_platform: "تطبيق ويب تقدمي (PWA)",
    cs_azkar_status: "تنفيذ تفاعلي مباشر",
    cs_azkar_sec1_desc:
      "تعاني العديد من تطبيقات الأذكار التقليدية من ازدحام النصوص، والإعلانات المزعجة، وضعف العمل دون إنترنت، وضعف التباين في ظروف الإضاءة المختلفة.",
    cs_azkar_sec2_desc:
      "تصميم تجربة قراءة صافية بخط عربي عالي الوضوح، ومسبحة تفاعلية بلمس مريح، وأنماط داكنة وعالية التباين دون أي اعتماد على الاتصال بالإنترنت.",
    cs_azkar_sec2_callout:
      "ابتكار وضع تركيز خالٍ من أي مشتتات مع عداد تقدم محفوظ ومراجع ميسرة للأذكار.",
    cs_azkar_sec4_desc:
      "تم تقديم تنفيذ خفيف ومتجاوب يركز على القراءة الهادئة، ووضوح التقدم، والاستخدام الموثوق عبر أحجام الشاشات.",
    cs_azkar_sec5_desc:
      "التطبيق متاح مجاناً للجميع. وينبغي أن يقيس التحقق المستقبلي إكمال جلسات الذكر والعودة اليومية مع احترام الخصوصية.",

    // Case Study 5: A Data-Driven LEGO Explorer
    cs_lego_title: "مستكشف مجموعات LEGO بالبيانات",
    cs_lego_badge: "تحليل وتصميم بصري • لوحة Power BI",
    cs_lego_sub:
      "منصة استكشاف بصري تفاعلية تحلل أسعار مجموعات LEGO التاريخية وعدد القطع وتطور السمات عبر العقود.",
    cs_lego_role: "مصور بيانات ومهندس لوحات معلومات",
    cs_lego_timeline: "شهران",
    cs_lego_platform: "Power BI وتحليلات Python",
    cs_lego_status: "تنفيذ تفاعلي مباشر",
    cs_lego_sec1_desc:
      "واجه هواة ومجمعو LEGO صعوبة في تقييم القيمة الاستثمارية ونسبة السعر لكل قطعة ودورات حياة المجموعات من الكتالوجات الثابتة.",
    cs_lego_sec2_desc:
      "استخراج ومعالجة بيانات الكتالوجات عبر عقود باستخدام Python وPower Query، مع بناء مخططات تفاعلية وهياكل توزيع بصرية دقيقة.",
    cs_lego_sec2_callout:
      "تطوير مصفوفة كفاءة سعر القطعة التي تتيح للمستخدمين تحديد المجموعات ذات القيمة الاستثنائية بلمحة سريعة.",
    cs_lego_sec4_desc:
      "تقديم بيئة استكشافية ممتعة تجمع بين الفضول التفاعلي ورواية القصص عبر علم البيانات.",
    cs_lego_sec5_desc:
      "تم استعراض التقرير التفاعلي في مجتمعات تصميم البيانات. وستتضمن التحديثات المستقبلية تتبع أسعار سوق إعادة البيع الحي.",
  },
  en: {
    about_text:
      "UX Designer & Data Visualizer with 8+ years of experience turning user and business needs into decision-ready dashboards and user-centered digital experiences. Skilled in user research, information architecture, data storytelling, visualization, and accessible interface design with Excel, Power BI, Tableau, SQL, and Python.",
    aria_dark_mode: "Dark mode",
    aria_high_contrast_mode: "High contrast mode",
    aria_switch_to_arabic: "Switch to Arabic",
    aria_switch_to_english: "Switch to English",
    cert1: "Google Data Analytics",
    cert1_meta: "Google · 2024",
    cert2_meta: "Tableau Learning Partner · 2024",
    cert3_meta: "Macquarie University · 2024",
    cert4_meta: "Macquarie University · 2024",
    cert5_meta: "Google · 2023",
    cert1_desc: "Build job-ready skills in data cleaning, analysis, visualization, and data-driven decision making using real-world datasets.",
    cert2_desc: "Demonstrates proficiency in Tableau to connect, analyze, visualize, and share data to drive business insights.",
    cert3_desc: "Advanced Excel skills for data analysis, modeling, visualization, and automation using formulas and pivot tables.",
    cert4_desc: "Business-focused Excel proficiency covering data management, advanced formulas, and professional reporting.",
    cert5_desc: "Foundational UX design principles including user research, wireframing, prototyping, and usability testing.",
    certs_subtitle: "Professional certifications that validate my expertise and commitment to continuous learning.",
    certs_count_label: "Certifications",
    cert2: "Tableau Business Intelligence Analyst",
    cert3: "Excel Skills for Data Analytics and Visualization",
    cert4: "Excel Skills for Business",
    cert5: "Google UX Design",
    back_to_top: "Back to top",
    control_contrast: "Contrast",
    control_language: "العربية",
    control_theme: "Theme",
    contact_dribbble: "Dribbble",
    contact_linkedin: "LinkedIn",
    contact_links_label: "Contact links",
    data_tag: "Data Visualization",
    display_settings_label: "Display settings",
    edu1_badge: "Diploma",
    edu1_date: "Sep 2016 - Jun 2017",
    edu1_desc: "Focused on instructional design, e-learning methodologies, and educational technology solutions.",
    edu1_school: "Information Technology Institute (ITI)",
    edu1_title: "Diploma of Education/Instructional Technology",
    edu2_badge: "Bachelor's",
    edu2_date: "Sep 2009 - Jun 2013",
    edu2_desc: "Studied broadcast communication, media production, and visual storytelling.",
    edu2_school: "Minufiya University",
    edu2_title: "Bachelor's degree, Radio and Television",
    exp_tag: "8+ years experience",
    footer_cta: "Let’s work together",
    footer_email: "Email Ahmed",
    footer_text:
      "Looking for UX leadership, accessible products, or decision-ready data experiences?",
    featured_work: "Featured Work",
    more_projects: "More Projects",
    hero_actions_label: "Portfolio and contact actions",
    external_site_hint: "opens external site",
    highlights_label: "Career highlights",
    job1_b1:
      "Leading UX/UI design for complex enterprise and B2B SaaS platforms, delivering user-centered solutions.",
    job1_b2:
      "Building scalable design systems using Figma, Adobe Creative Suite, and modern methodologies.",
    job1_b3:
      "Leveraging AI design tools to accelerate prototyping workflows and synthesize UX research.",
    job1_company: "Advansys IS",
    job1_company_desc: "Leading IT solutions provider specializing in enterprise software, digital transformation, and system integration across the MENA region.",
    job1_date: "Jan 2023 - Present · 3 yrs 6 mos",
    job1_date_range: "Jan 2023 – Present",
    job1_duration: "3 yrs 6 mos",
    job1_location: "Cairo, Egypt",
    job1_type: "Full-time",
    job1_title: "UX Designer",
    job1_impact1_metric: "Design Systems",
    job1_impact1_label: "Scalable Components",
    job1_impact1_desc: "Established scalable design systems using Figma and modern methodologies for B2B platforms.",
    job1_impact2_metric: "Enterprise UX",
    job1_impact2_label: "Complex SaaS Platforms",
    job1_impact2_desc: "Led UX/UI design for complex B2B and enterprise SaaS platforms, driving user-centric solutions.",
    job1_impact3_metric: "AI-Powered",
    job1_impact3_label: "Rapid Prototyping",
    job1_impact3_desc: "Leveraged AI design tools to accelerate prototyping workflows and synthesize UX research.",
    key_impact: "Key Impact",
    jobs_subtitle: "Where I've worked and the impact I delivered",
    job2_b1:
      "Redesigned corporate learning platforms and interfaces, increasing user engagement and course completion rates by 30%.",
    job2_b2:
      "Translated complex technical requirements into accessible, intuitive B2B e-learning experiences.",
    job2_company: "Schneider Electric",
    job2_company_desc: "Global leader in energy management and automation, driving digital transformation across enterprise and industrial solutions.",
    job2_date: "Jul 2018 - Jan 2023 · 4 yrs 7 mos",
    job2_date_range: "Jul 2018 – Jan 2023",
    job2_duration: "4 yrs 7 mos",
    job2_location: "Cairo, Egypt",
    job2_type: "Full-time",
    job2_title: "Instructional Designer",
    job2_impact1_metric: "+30%",
    job2_impact1_label: "Course Completion",
    job2_impact1_desc: "Redesigned corporate learning platforms and interfaces, increasing engagement and completion rates.",
    job2_impact2_metric: "Scalable Solutions",
    job2_impact2_label: "Global Learning Platforms",
    job2_impact2_desc: "Built scalable, reusable learning assets and templates that streamlined content delivery.",
    job2_impact3_metric: "Learner-Centered",
    job2_impact3_label: "Results-Driven Design",
    job2_impact3_desc: "Applied learning science and UX principles to create impactful, learner-centered experiences.",
    main_resume_label: "Main resume content",
    meta_description:
      "Online resume for Ahmed Mahdy, a UX Designer & Data Visualizer with expertise in UX design, dashboards, and digital product experiences.",
    meta_title: "Ahmed Mahdy | UX Designer & Data Visualizer",
    name: "Ahmed Mahdy",
    opens_new_tab: " opens in a new tab",
    profile_details_label: "Profile details",
    proj_data1_desc:
      "Interactive Tableau data visualization helping users explore LEGO sets across themes, age ranges, prices, and piece counts.",
    proj_data1_title: "A Data-Driven LEGO Explorer",
    proj_data2_desc:
      "CRM sales dashboard built in Google Sheets to track quarterly team performance via chart-driven visualization.",
    proj_data2_title: "Sales Performance Dashboard",
    proj_data_header: "Data Analysis & Visualization Projects",
    proj_ux1_desc:
      "Responsive, privacy-focused HR SaaS concept for leave requests, role-based approvals, and request-status visibility.",
    proj_ux1_title: "HR Management Tool",
    proj_ux2_desc:
      "Interactive operational dashboard concept focused on clear data visualization, information hierarchy, and responsive behavior.",
    proj_ux2_title: "Cairo International Airport - Command Hub",
    proj_ux3_desc:
      "Accessible mobile e-commerce concept with search-first navigation and a consolidated guest checkout.",
    proj_ux3_title: "Haj Arafa App",
    proj_ux4_desc:
      "Accessible Arabic-first remembrance and prayer-time application with offline support, calm reading, and clear progress.",
    proj_ux4_title: "Azkar App – Daily Fortress",
    proj_ux_header: "UX Projects",
    print_resume_action: "Print / Save PDF",
    read_case_study: "Read Case Study",
    resume_card_label: "Resume overview",
    resume_label: "Ahmed Mahdy resume portfolio",
    section_nav_label: "Resume sections",
    sect_about: "About Me",
    sect_certs: "Certifications",
    sect_edu: "Education",
    sect_jobs: "Employment",
    sect_projects: "Projects",
    sect_skills: "Skills",
    skill_data1: "Excel (Advanced)",
    skill_data2: "Power BI",
    skill_data3: "Tableau",
    skill_data4: "Python",
    skill_data5: "SQL",
    skill_data6: "Dashboard Design",
    skill_data7: "Data Storytelling",
    skill_data8: "KPI Analysis",
    skill_ux1: "Interaction Design",
    skill_ux10: "Enterprise & SaaS Design",
    skill_ux11: "Adobe Creative Suite",
    skill_ux12: "AI Design Tools",
    skill_ux2: "Information Architecture",
    skill_ux3: "User Research",
    skill_ux4: "Usability Testing",
    skill_ux5: "Wireframing",
    skill_ux6: "Prototyping",
    skill_ux7: "Figma",
    skill_ux8: "Design Systems",
    skill_ux9: "Accessibility",
    skill_tool1: "Microsoft 365",
    skill_tool2: "Google Workspace",
    skill_tool3: "Looker Studio",
    skill_tool4: "Git & GitHub",
    skills_data_header: "Data Analysis & Visualization",
    skills_data_desc: "Turning data into meaningful insights and impactful visual stories.",
    skills_ux_header: "Core UX & Design",
    skills_ux_desc: "Crafting intuitive interfaces and seamless experiences that solve real user and business problems.",
    skills_tools_header: "Tools & Technologies",
    skills_tools_desc: "Technologies I use to design, analyze, prototype, and deliver data-informed solutions.",
    skills_subtitle: "A blend of design thinking, data expertise, and modern tools to build clarity-driven, user-centered digital experiences.",
    skills_tagline: "Continuously learning & exploring new tools",
    skill_level_proficient: "Proficient",
    skill_level_advanced: "Advanced",
    skill_level_expert: "Expert",
    skip_link: "Skip to resume content",
    title: "UX Designer & Data Visualizer",
    hero_cta_work: "View Selected Work",
    hero_cta_print: "Print / Save Résumé",
    hero_value:
      "I turn complex products and data into clear, accessible experiences, informed by a background in eLearning and video authoring.",
    view_selected_work: "View Selected Work",
    project_owner_ux: "Ahmed Mahdy · UX Designer",
    project_owner_data: "Ahmed Mahdy · UX & Data Visualization",
    project_type_independent: "Independent Project",
    project_status_live: "Live Interactive Build",
    project_disclosure:
      "All UX projects were designed by Ahmed Mahdy in Figma. Antigravity, Codex, and Claude assisted in translating the designs into live applications under his direction and review.",
    toast_copied: "Copied",
    toast_copy_cert: "Certification link copied to clipboard",
    toast_copy_dribbble: "Dribbble link copied to clipboard",
    toast_copy_email: "Email address copied to clipboard",
    toast_copy_linkedin: "LinkedIn link copied to clipboard",
    toast_copy_project: "Project link copied to clipboard",
    hero_bio:
      "I help businesses turn complex data into clear insights and beautiful experiences that people love to use.",
    hero_cta_resume: "Download Résumé",
    hero_availability: "Available for new projects",
    contact_email_sub: "Protected email",
    contact_li_sub: "Professional profile",
    contact_dr_sub: "Selected design work",
    tooltip_contrast: "Toggle high contrast",
    tooltip_copy_cert: "Copy certification link",
    tooltip_copy_dribbble: "Copy Dribbble link",
    tooltip_copy_email: "Copy email",
    tooltip_copy_linkedin: "Copy LinkedIn link",
    tooltip_copy_project: "Copy project link",
    tooltip_send_email: "Send email",
    tooltip_lang: "Toggle language",
    tooltip_theme_dark: "Switch to dark mode",
    tooltip_theme_light: "Switch to light mode",
    tooltip_visit_live_site: "Visit Live Site",
    ux_tag: "UX Design",
    visit_live_project: "View Live Project",
    collapse_project: "Collapse",
    expand_project: "Expand",

    // Case Study Shared UI
    cs_back_to_projects: "Back to Projects",
    cs_home: "Home",
    cs_projects: "Projects",
    cs_listen: "Listen",
    cs_pause: "Pause",
    cs_hide_preview: "Hide Interactive Preview",
    cs_image_preview: "Image preview",
    cs_close_image_preview: "Close image preview",
    cs_zoom_image: "Zoom image",
    print_portfolio_title: "Ahmed Mahdy — Interactive Portfolio & Case Studies",
    print_scan_online: "Scan to View Online",
    cs_role: "Role",
    cs_timeline: "Timeline",
    cs_platform: "Platform",
    cs_status: "Status",
    cs_interactive_preview: "Interactive Preview",
    cs_visit_live: "Visit Live Project",
    cs_visit_dashboard: "Open Dashboard",
    cs_desktop: "Desktop",
    cs_mobile: "Mobile (390px)",
    cs_open_tab: "Open in New Tab",
    cs_key_decision: "Key Design Decision",
    cs_prev_project: "Previous Project",
    cs_next_project: "Next Project",
    cs_sec1_title: "01 Context & Challenge",
    cs_sec2_title: "02 Approach & Key Decisions",
    cs_sec3_title: "03 Tools & Technologies",
    cs_sec4_title: "04 Outcome & Impact",
    cs_sec5_title: "05 Evidence & Next Validation",
    cs_sec6_title: "06 Ownership & Learning",
    cs_provenance_ownership: "Ownership",
    cs_provenance_ownership_desc:
      "Ahmed Mahdy owned the UX design, information architecture, visual direction, content, and final project decisions.",
    cs_provenance_background: "Professional perspective",
    cs_provenance_background_desc:
      "The work draws on his UX practice and background in eLearning and video authoring to simplify information, sequence interactions, and build a clear narrative.",
    cs_provenance_ai: "AI-assisted implementation",
    cs_provenance_ai_desc:
      "Ahmed translated the Figma designs into a live project with assistance from Antigravity, Codex, and Claude agents, then reviewed, refined, and tested the implementation.",
    cs_provenance_evidence: "Evidence boundary",
    cs_provenance_evidence_desc:
      "Evidence shown is the design, live implementation, and documented case-study decisions. No quantitative business outcome is attributed without a documented source and measurement.",
    cs_haj_learning:
      "Special learning: shaping a concise responsive commerce journey and directing AI agents to implement navigation and checkout states faithfully.",
    cs_cairo_learning:
      "Special learning: preserving information hierarchy and visual clarity while translating a dense operational dashboard from Figma into a live experience.",
    cs_hr_learning:
      "Special learning: modeling role-based workflows and approval states while reviewing AI-generated implementation for accessibility and clarity.",
    cs_azkar_learning:
      "Special learning: protecting Arabic-first, RTL, and reading-quality requirements while using agents on a content-sensitive experience.",
    cs_lego_learning:
      "Special learning: turning data exploration into interactive visual storytelling and choosing the best agent or tool for each task instead of relying on one tool.",

    // Case Study 1: Haj Arafa App
    cs_haj_title: "Haj Arafa App",
    cs_haj_badge: "Mobile Commerce • E-Commerce UX",
    cs_haj_sub:
      "Mobile-first e-commerce interface showcasing search-first navigation and express 2-step checkout.",
    cs_haj_role: "UX Designer",
    cs_haj_timeline: "3 Months",
    cs_haj_platform: "Mobile-First Web App",
    cs_haj_status: "Live Interactive Build",
    cs_haj_sec1_desc:
      "The design brief focused on simplifying deeply nested mobile categories and a lengthy checkout flow that required account creation.",
    cs_haj_sec2_desc:
      "Mapped the intended shopping journey and designed search-first navigation, guest checkout, and prominent 44px touch targets informed by relevant WCAG 2.2 criteria.",
    cs_haj_sec2_callout:
      "Consolidated five interface stages into one accordion-based checkout concept with address autofill and a clear cost breakdown.",
    cs_haj_sec4_desc:
      "Delivered a live responsive implementation with a shorter, clearer path from product discovery to order confirmation.",
    cs_haj_sec5_desc:
      "The live implementation demonstrates the proposed journey. Conversion and abandonment outcomes have not yet been measured and require privacy-conscious production analytics.",

    // Case Study 2: Cairo International Airport - Command Hub
    cs_cairo_title: "Cairo International Airport - Command Hub",
    cs_cairo_badge: "Operations & Aviation • Tableau Dashboard",
    cs_cairo_sub:
      "Operational command dashboard concept organizing runway, punctuality, and ground-service signals into one responsive view.",
    cs_cairo_role: "UX & Data Visualization Designer",
    cs_cairo_timeline: "4 Months",
    cs_cairo_platform: "Tableau Desktop & Cloud",
    cs_cairo_status: "Live Interactive Build",
    cs_cairo_sec1_desc:
      "The design challenge was to unify baggage, turnaround, and gate-congestion signals into one interface that could be scanned quickly by station managers.",
    cs_cairo_sec2_desc:
      "Structured the dashboard around clear visual quadrants and interactive threshold filtering, with SQL and Tableau represented in the proposed data workflow.",
    cs_cairo_sec2_callout:
      "Designed a configurable color-coded warning pattern to surface turnaround risks before they become critical.",
    cs_cairo_sec4_desc:
      "Delivered a live dashboard implementation demonstrating the proposed operational hierarchy and decision-support interactions.",
    cs_cairo_sec5_desc:
      "The live implementation is the available evidence. Operational adoption and response-time impact have not been independently measured.",

    // Case Study 3: HR Management Tool
    cs_hr_title: "HR Management Tool",
    cs_hr_badge: "Enterprise UX • SaaS Product Design",
    cs_hr_sub:
      "All-in-one workforce operations platform streamlining leave approvals, performance reviews, and department shift scheduling.",
    cs_hr_role: "UX Designer",
    cs_hr_timeline: "4 Months",
    cs_hr_platform: "Web Application (SaaS)",
    cs_hr_status: "Live Interactive Build",
    cs_hr_sec1_desc:
      "The design brief addressed fragmented forms, email approval chains, and limited visibility into leave balances.",
    cs_hr_sec2_desc:
      "Designed modular dashboards with self-service requests, role-based approval routing, and accessible calendar timelines.",
    cs_hr_sec2_callout:
      "Created a batch-review modal concept for approving recurring team schedule adjustments from one focused view.",
    cs_hr_sec4_desc:
      "Designed the self-service and approval flow to reduce delays and improve request-status clarity; verified production data is still required to quantify the operational impact.",
    cs_hr_sec5_desc:
      "The live implementation demonstrates the workflow. Production adoption and time-saved outcomes require documented organizational data.",

    // Case Study 4: Azkar Application
    cs_azkar_title: "Azkar Application",
    cs_azkar_badge: "Mobile UX • Islamic Productivity",
    cs_azkar_sub:
      "Accessible, offline-capable digital remembrance suite featuring dynamic daily Dhikr tracking and interactive Tasbeeh counter.",
    cs_azkar_role: "UX Designer",
    cs_azkar_timeline: "2 Months",
    cs_azkar_platform: "Progressive Web App (PWA)",
    cs_azkar_status: "Live Interactive Build",
    cs_azkar_sec1_desc:
      "Traditional remembrance apps often suffer from cluttered typography, intrusive ads, lack of offline reliability, and poor contrast under varying lighting conditions.",
    cs_azkar_sec2_desc:
      "Designed an uncluttered reading experience with large Arabic typography, tactile counter feedback, dark and high contrast modes, and zero network dependency.",
    cs_azkar_sec2_callout:
      "Crafted a zero-distraction focus mode with persistent progress counters and instant Arabic/English recitation references.",
    cs_azkar_sec4_desc:
      "Delivered a lightweight, responsive implementation focused on calm reading, clear progress, and reliable use across screen sizes.",
    cs_azkar_sec5_desc:
      "Freely available live application. Future validation should measure remembrance-session completion and daily return behavior with privacy-respecting analytics.",

    // Case Study 5: A Data-Driven LEGO Explorer
    cs_lego_title: "A Data-Driven LEGO Explorer",
    cs_lego_badge: "Analytics & Visual Design • Power BI",
    cs_lego_sub:
      "Interactive visual exploration platform analyzing historical LEGO set pricing, piece counts, and theme progressions across decades.",
    cs_lego_role: "Data Visualization Designer",
    cs_lego_timeline: "2 Months",
    cs_lego_platform: "Power BI & Python Analytics",
    cs_lego_status: "Live Interactive Build",
    cs_lego_sec1_desc:
      "LEGO enthusiasts and collectors struggled to evaluate investment value, piece-to-price ratios, and historical theme lifecycles from static catalogs.",
    cs_lego_sec2_desc:
      "Extracted and transformed multi-decade catalog datasets using Python and Power Query, building dynamic scatter plots and theme distribution hierarchies.",
    cs_lego_sec2_callout:
      "Developed an intuitive price-per-piece efficiency matrix allowing users to spot exceptional value sets at a glance.",
    cs_lego_sec4_desc:
      "Created an engaging, analytical playground that bridges playful curiosity with data science storytelling.",
    cs_lego_sec5_desc:
      "Interactive report showcased to data design communities. Future updates will incorporate real-time secondary market resale feeds.",
  },
};

/**
 * Returns the current active language from the root element's lang attribute.
 * @returns {'en'|'ar'} The current language code.
 */
function getCurrentLanguage() {
  return root.getAttribute("lang") || "en";
}

/**
 * Retrieves a translated string for the given language and key.
 * @param {'en'|'ar'} lang - Language code.
 * @param {string} key - Translation key.
 * @param {string} [fallback=''] - Fallback string if key not found.
 * @returns {string} Translated string or fallback.
 */
function getTranslation(lang, key, fallback = "") {
  return translations[lang]?.[key] ?? fallback;
}

/**
 * Updates the href of an SVG <use> element inside a button.
 * @param {HTMLElement|null} button - The button element.
 * @param {string} iconId - The SVG symbol ID (e.g. '#icon-moon').
 */
function setUseIcon(button, iconId) {
  const useNode = button?.querySelector("use");
  if (useNode) {
    useNode.setAttribute("href", iconId);
  }
}

/**
 * Updates the <meta name="theme-color"> to reflect the current theme and contrast state.
 */
function updateThemeColor() {
  if (!metaNodes.themeColor) {
    return;
  }

  const isHighContrast = root.dataset.contrast === "high";
  const isDark = root.dataset.theme === "dark";

  metaNodes.themeColor.setAttribute(
    "content",
    isHighContrast ? "#000000" : isDark ? "#3b82f6" : "#005f88",
  );
}

/**
 * Updates all SEO meta tags, Open Graph, Twitter card, and JSON-LD schema
 * to reflect the current language.
 * @param {'en'|'ar'} lang - Language code.
 */
function updateMetadata(lang) {
  const projectKey = document.body.dataset.projectKey;
  const projectTitle = projectKey
    ? getTranslation(lang, `${projectKey}_title`)
    : "";
  const title = projectTitle
    ? `${projectTitle} | ${lang === "ar" ? "ملف أعمال أحمد مهدي" : "Ahmed Mahdy Portfolio"}`
    : getTranslation(lang, "meta_title", document.title);
  const description = projectKey
    ? getTranslation(
        lang,
        `${projectKey}_sub`,
        metaNodes.description?.getAttribute("content") || "",
      )
    : getTranslation(
        lang,
        "meta_description",
        metaNodes.description?.getAttribute("content") || "",
      );

  document.title = title;
  metaNodes.description?.setAttribute("content", description);
  metaNodes.ogTitle?.setAttribute("content", title);
  metaNodes.ogDescription?.setAttribute("content", description);
  metaNodes.twitterTitle?.setAttribute("content", title);
  metaNodes.twitterDescription?.setAttribute("content", description);

  if (metaNodes.personSchema) {
    if (projectKey) {
      try {
        const schema = JSON.parse(metaNodes.personSchema.textContent);
        const entries = Array.isArray(schema) ? schema : [schema];
        const person = entries.find((entry) => entry["@type"] === "Person");
        const creativeWork = entries.find(
          (entry) => entry["@type"] === "CreativeWork",
        );
        const breadcrumbs = entries.find(
          (entry) => entry["@type"] === "BreadcrumbList",
        );

        if (person)
          person.jobTitle = getTranslation(lang, "title", person.jobTitle);
        if (creativeWork) {
          creativeWork.name = projectTitle;
          creativeWork.headline = projectTitle;
          creativeWork.description = description;
        }
        const lastBreadcrumb = breadcrumbs?.itemListElement?.at(-1);
        if (lastBreadcrumb) lastBreadcrumb.name = projectTitle;
        metaNodes.personSchema.textContent = JSON.stringify(entries, null, 2);
      } catch {
        // Keep the static project-specific schema when it cannot be parsed.
      }
    } else {
      metaNodes.personSchema.textContent = JSON.stringify(
        {
          "@context": "https://schema.org",
          "@type": "Person",
          name: "Ahmed Mahdy",
          jobTitle: getTranslation(
            lang,
            "title",
            "UX Designer & Data Visualizer",
          ),
          email: siteMeta.email,
          url: siteMeta.url,
          image: siteMeta.image,
          sameAs: siteMeta.sameAs,
          knowsAbout: siteMeta.knowsAbout,
        },
        null,
        2,
      );
    }
  }
}

/**
 * Replaces text content for all elements with [data-translate] attributes.
 * @param {'en'|'ar'} lang - Language code.
 */
function updateTranslatedText(lang) {
  document.querySelectorAll("[data-translate]").forEach((node) => {
    const key = node.dataset.translate;
    const value = getTranslation(lang, key);

    if (!value) return;
    const textNode = [...node.childNodes].find(
      (child) => child.nodeType === Node.TEXT_NODE,
    );
    if (textNode && node.children.length) textNode.textContent = `${value} `;
    else node.textContent = value;
  });
}

/**
 * Updates HTML attributes (e.g. aria-label) for elements with [data-translate-attr].
 * @param {'en'|'ar'} lang - Language code.
 */
function updateTranslatedAttributes(lang) {
  document.querySelectorAll("[data-translate-attr]").forEach((node) => {
    const attrName = node.dataset.translateAttr;
    const key = node.dataset.translateAttrKey;
    const value = getTranslation(lang, key);

    if (attrName && key && value) {
      node.setAttribute(attrName, value);
    }
  });
}

function getLinkText(link) {
  const note = link.querySelector(".sr-only[data-translate='opens_new_tab']");

  return Array.from(link.childNodes)
    .filter((node) => node !== note && !(node instanceof SVGElement))
    .map((node) => node.textContent)
    .join("")
    .trim();
}

/**
 * Adds an external-link cue and a visually-hidden new-tab note to every
 * target="_blank" link.
 * Idempotent — safe to call multiple times.
 * @param {'en'|'ar'} lang - Language code for the note text.
 */
function ensureExternalLinkNotes(lang) {
  const noteText = getTranslation(
    lang,
    "opens_new_tab",
    lang === "ar"
      ? " \u064a\u0641\u062a\u062d \u0641\u064a \u062a\u0628\u0648\u064a\u0628 \u062c\u062f\u064a\u062f"
      : " opens in new tab",
  );

  document.querySelectorAll('a[target="_blank"]').forEach((link) => {
    link.rel = "noopener noreferrer";

    let note = link.querySelector(".sr-only[data-translate='opens_new_tab']");

    if (!note) {
      note = document.createElement("span");
      note.className = "sr-only";
      note.dataset.translate = "opens_new_tab";
      link.appendChild(note);
    }

    if (!link.querySelector(".external-icon")) {
      const icon = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "svg",
      );
      const use = document.createElementNS("http://www.w3.org/2000/svg", "use");

      icon.classList.add("external-icon");
      icon.setAttribute("aria-hidden", "true");
      use.setAttribute("href", "#icon-external");
      icon.appendChild(use);
      link.insertBefore(icon, note);
    }

    note.textContent = noteText;
  });
}

/**
 * Refreshes aria-label and title attributes on all external links to include
 * the translated "opens external site" hint and "opens in new tab" note.
 * Also calls ensureExternalLinkNotes to guarantee the SR-only span is present.
 * @param {'en'|'ar'} lang - Language code.
 */
function updateExternalLinks(lang) {
  const hint = getTranslation(lang, "external_site_hint");
  const newTabText = getTranslation(
    lang,
    "opens_new_tab",
    lang === "ar"
      ? "\u064a\u0641\u062a\u062d \u0641\u064a \u062a\u0628\u0648\u064a\u0628 \u062c\u062f\u064a\u062f"
      : "opens in new tab",
  ).trim();

  ensureExternalLinkNotes(lang);

  document.querySelectorAll('a[target="_blank"]').forEach((link) => {
    let label = getLinkText(link);
    if (!label) {
      const article = link.closest("article");
      const projectTitle = article?.querySelector("h4")?.textContent?.trim();
      const fallbackKey = link.dataset.tooltipKey;
      const baseLabel = fallbackKey
        ? getTranslation(lang, fallbackKey, "Visit live site")
        : "Visit live site";
      label = projectTitle ? `${baseLabel}: ${projectTitle}` : baseLabel;
    }
    const context = [hint, newTabText].filter(Boolean).join(", ");

    link.setAttribute("aria-label", context ? `${label} (${context})` : label);
    link.setAttribute("title", context || label);

    if (link.dataset.tooltipKey) {
      link.setAttribute(
        "data-tooltip",
        getTranslation(
          lang,
          link.dataset.tooltipKey,
          link.getAttribute("data-tooltip") || "",
        ),
      );
    }
  });
}

/**
 * Updates aria-label and data-tooltip on all copy buttons to match
 * the current language.
 * @param {'en'|'ar'} lang - Language code.
 */
function updateCopyButtons(lang) {
  document.querySelectorAll("[data-copy]").forEach((button) => {
    const key = button.dataset.tooltipKey;
    const genericLabel = getTranslation(
      lang,
      key,
      button.getAttribute("aria-label") || "",
    );
    const link = button.closest("li, article")?.querySelector("a");
    const includesSubject =
      key === "tooltip_copy_cert" || key === "tooltip_copy_project";
    const subject = includesSubject && link ? getLinkText(link) : "";
    const label = subject ? `${genericLabel}: ${subject}` : genericLabel;

    if (label) {
      button.setAttribute("aria-label", label);
      button.setAttribute("data-tooltip", genericLabel);
    }
  });
}

/**
 * Updates the language toggle button aria-label and tooltip to indicate
 * which language it will switch to.
 * @param {'en'|'ar'} lang - The currently active language.
 */
function updateLanguageButton(lang) {
  const nextLanguageLabel =
    lang === "ar"
      ? getTranslation(lang, "aria_switch_to_english")
      : getTranslation(lang, "aria_switch_to_arabic");

  document.querySelectorAll(".lang-toggle").forEach((button) => {
    button.setAttribute("aria-label", nextLanguageLabel);
    button.setAttribute("data-tooltip", getTranslation(lang, "tooltip_lang"));
    const label = button.querySelector(".control-label");
    if (label) label.setAttribute("lang", lang === "ar" ? "en" : "ar");
  });
}

/**
 * Updates the theme toggle button icon, aria-label, aria-pressed, and tooltip
 * to reflect the current theme state.
 * @param {'en'|'ar'} lang - Language code for translated labels.
 */
function updateThemeButton(lang) {
  const isDark = root.dataset.theme === "dark";
  const tooltip = isDark
    ? getTranslation(lang, "tooltip_theme_light")
    : getTranslation(lang, "tooltip_theme_dark");

  controls.themeToggle?.setAttribute(
    "aria-label",
    getTranslation(lang, "aria_dark_mode"),
  );
  controls.themeToggle?.setAttribute("aria-pressed", String(isDark));
  controls.themeToggle?.setAttribute("data-tooltip", tooltip);
  setUseIcon(controls.themeToggle, isDark ? "#icon-sun" : "#icon-moon");
}

/**
 * Updates the contrast toggle button aria-label, aria-pressed, tooltip,
 * and active class to reflect the current contrast state.
 * @param {'en'|'ar'} lang - Language code for translated labels.
 */
function updateContrastButton(lang) {
  const isHigh = root.dataset.contrast === "high";

  controls.contrastToggle?.setAttribute(
    "aria-label",
    getTranslation(lang, "aria_high_contrast_mode"),
  );
  controls.contrastToggle?.setAttribute("aria-pressed", String(isHigh));
  controls.contrastToggle?.setAttribute(
    "data-tooltip",
    getTranslation(lang, "tooltip_contrast"),
  );
  controls.contrastToggle?.classList.toggle("active", isHigh);
}

/**
 * Updates aria-label on all collapsible project card toggle buttons to match
 * current language and expansion state.
 * @param {'en'|'ar'} lang - Language code.
 */
/**
 * Orchestrates a full UI refresh for a language switch or initial load.
 * Runs all translation, metadata, link, button, and aria-label update functions.
 * @param {'en'|'ar'} lang - Language code to apply.
 */
function refreshUi(lang) {
  if (document.body.dataset.localized !== "false") {
    updateTranslatedText(lang);
    updateTranslatedAttributes(lang);
    updateMetadata(lang);
  }
  updateExternalLinks(lang);
  updateCopyButtons(lang);
  updateLanguageButton(lang);
  updateThemeButton(lang);
  updateContrastButton(lang);
}

/**
 * Applies a theme, persists it to localStorage, and refreshes the UI.
 * @param {'light'|'dark'} theme - Theme name to apply.
 */
function setTheme(theme) {
  root.dataset.theme = theme;
  localStorage.setItem(storageKeys.theme, theme);
  updateThemeColor();
  updateThemeButton(getCurrentLanguage());
}

/**
 * Applies a contrast mode, persists it to localStorage, and refreshes the UI.
 * @param {'normal'|'high'} contrast - Contrast level to apply.
 */
function setContrast(contrast) {
  root.dataset.contrast = contrast;
  localStorage.setItem(storageKeys.contrast, contrast);
  updateThemeColor();
  updateContrastButton(getCurrentLanguage());
}

/**
 * Switches the active language: updates the html element's lang/dir attributes,
 * persists the choice to localStorage, and runs a full UI refresh.
 * @param {'en'|'ar'} lang - Language code to activate.
 */
function setLanguage(lang, persist = true) {
  const staticLocale = document.body.dataset.staticLocale;
  if (persist && staticLocale && lang !== staticLocale) {
    localStorage.setItem(storageKeys.lang, lang);
    location.assign(`/${lang}${document.body.dataset.staticPath || "/"}`);
    return;
  }
  root.setAttribute("lang", lang);
  root.setAttribute("dir", lang === "ar" ? "rtl" : "ltr");
  if (persist) localStorage.setItem(storageKeys.lang, lang);
  refreshUi(lang);
}

/**
 * Copies a string to the clipboard using the Clipboard API when available,
 * with a textarea execCommand fallback for non-secure contexts.
 * Restores focus and selection state after the fallback path.
 * @param {string} value - The text to copy.
 * @returns {Promise<void>}
 * @throws {Error} If the fallback copy command fails.
 */
async function copyText(value) {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const textarea = document.createElement("textarea");
  const selection = window.getSelection();
  const activeElement = document.activeElement;
  const originalRange =
    selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null;

  textarea.value = value;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  textarea.style.top = "0";

  document.body.appendChild(textarea);
  textarea.focus({ preventScroll: true });
  textarea.select();
  textarea.setSelectionRange(0, textarea.value.length);

  let copied = false;

  try {
    copied = document.execCommand("copy");
  } finally {
    document.body.removeChild(textarea);

    if (activeElement instanceof HTMLElement) {
      activeElement.focus();
    }

    if (selection) {
      selection.removeAllRanges();
      if (originalRange) {
        selection.addRange(originalRange);
      }
    }
  }

  if (!copied) {
    throw new Error("copy command unsuccessful");
  }
}

/**
 * Displays a live-region toast notification for the given message.
 * Auto-dismisses after 5 seconds. Resets the timer if called while visible.
 * @param {string} message - The message text to display.
 */
function showToast(message) {
  window.clearTimeout(toastTimer);
  copyToast.textContent = message;
  copyToast.classList.add("is-visible");
  toastTimer = window.setTimeout(() => {
    copyToast.classList.remove("is-visible");
  }, 5000);
}

/**
 * Creates a fully accessible copy button element with icon, aria-label, and tooltip.
 * @param {string} value - The text value to copy on click.
 * @param {string} label - The initial aria-label / tooltip string.
 * @param {string} key - The translation key used to update the label on language switch.
 * @returns {HTMLButtonElement} The constructed button element.
 */
function createCopyButton(value, label, key) {
  const button = document.createElement("button");
  const iconWrapper = document.createElement("span");
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  const use = document.createElementNS("http://www.w3.org/2000/svg", "use");

  button.className = "copy-button";
  button.type = "button";
  button.dataset.copy = value;
  button.dataset.tooltipKey = key;
  button.setAttribute("aria-label", label);
  button.setAttribute("data-tooltip", label);

  iconWrapper.setAttribute("aria-hidden", "true");
  use.setAttribute("href", "#icon-copy");
  svg.appendChild(use);
  iconWrapper.appendChild(svg);
  button.appendChild(iconWrapper);

  return button;
}

/**
 * Dynamically injects a share/copy button into project cards and makes the
 * whole card clickable (excluding the link and button themselves).
 * Certifications deliberately carry credential metadata instead of a copy
 * button — nobody copies a certificate name, and five of them turned the
 * panel into noise.
 * Safe to call multiple times — skips cards that already have a copy button.
 */
function enhanceLinkedCards() {
  document.querySelectorAll(".featured h4 a").forEach((link) => {
    const container = link.closest("article");

    if (!container || container.querySelector(".copy-button")) {
      return;
    }

    const tooltipKey = "tooltip_copy_project";
    const label = getTranslation(getCurrentLanguage(), tooltipKey);
    const copyButton = createCopyButton(link.href, label, tooltipKey);

    container.appendChild(copyButton);
    container.addEventListener("click", (event) => {
      if (event.target.closest("a, button")) {
        return;
      }

      link.click();
    });
  });

  document.querySelectorAll(".compact-list li").forEach((item) => {
    const link = item.querySelector("a");

    if (!link || item.dataset.cardBound === "true") {
      return;
    }

    item.dataset.cardBound = "true";
    item.addEventListener("click", (event) => {
      if (event.target.closest("a, button")) {
        return;
      }

      link.click();
    });
  });
}

/**
 * Attaches click event listeners to all [data-copy] buttons.
 * Uses a data-copy-bound guard to prevent duplicate bindings.
 * Shows a contextual toast and temporarily swaps the icon on success.
 */
function bindCopyButtons() {
  document.querySelectorAll("[data-copy]").forEach((button) => {
    if (button.dataset.copyBound === "true") {
      return;
    }

    button.dataset.copyBound = "true";
    button.addEventListener("click", async (event) => {
      event.stopPropagation();

      const lang = getCurrentLanguage();

      try {
        await copyText(button.dataset.copy);
        const toastKey = button.dataset.tooltipKey
          ? button.dataset.tooltipKey.replace("tooltip_copy_", "toast_copy_")
          : "";
        const toastMessage = getTranslation(
          lang,
          toastKey,
          getTranslation(lang, "toast_copied"),
        );

        showToast(toastMessage);

        setUseIcon(button, "#icon-check");
        button.classList.add("copied");

        window.setTimeout(() => {
          setUseIcon(button, "#icon-copy");
          button.classList.remove("copied");
        }, 1500);
      } catch {
        showToast(getTranslation(lang, "toast_failed"));
      }
    });
  });
}

/**
 * Dynamically generates and injects a <style> block that populates @page
 * running headers and footers with the current name, title, date, and
 * page counter — localised for the active language and text direction.
 */
function updatePrintStyles() {
  const lang = getCurrentLanguage();
  const isRtl = root.getAttribute("dir") === "rtl";
  const nameText =
    document.querySelector('h1[data-translate="name"]')?.textContent?.trim() ||
    "Ahmed Mahdy";
  const titleText =
    document.querySelector('p[data-translate="title"]')?.textContent?.trim() ||
    "UX Designer & Data Visualizer";
  const dateText = new Date().toLocaleDateString(
    lang === "ar" ? "ar-EG" : "en-US",
    {
      year: "numeric",
      month: "short",
      day: "numeric",
    },
  );
  const pageText = lang === "ar" ? "صفحة" : "Page";
  const ofText = lang === "ar" ? "من" : "of";
  const leftContent = isRtl ? `"${nameText} | ${titleText}"` : `"${dateText}"`;
  const rightContent = isRtl ? `"${dateText}"` : `"${nameText} | ${titleText}"`;

  let dynamicStyle = document.getElementById("print-dynamic-style");

  if (!dynamicStyle) {
    dynamicStyle = document.createElement("style");
    dynamicStyle.id = "print-dynamic-style";
    document.head.appendChild(dynamicStyle);
  }

  dynamicStyle.textContent = `
    @media print {
      @page {
        @top-left {
          content: ${leftContent} !important;
        }
        @top-right {
          content: ${rightContent} !important;
        }
        @bottom-center {
          content: "${pageText} " counter(page) " ${ofText} " counter(pages) !important;
        }
      }
    }
  `;
}

/**
 * Entry point. Enhances cards with copy buttons, binds all copy button
 * listeners, then applies the saved (or system-preferred) theme, contrast,
 * and language to boot the UI.
 */
/**
 * Initializes a smooth reading progress bar for case study pages.
 */
function initReadingProgressBar() {
  if (!document.querySelector(".case-study-card")) return;

  let bar = document.querySelector(".reading-progress-bar");
  if (!bar) {
    bar = document.createElement("div");
    bar.className = "reading-progress-bar";
    bar.setAttribute("aria-hidden", "true");
    document.body.prepend(bar);
  }

  let ticking = false;
  const updateProgress = () => {
    const totalHeight =
      document.documentElement.scrollHeight - window.innerHeight;
    if (totalHeight > 0) {
      const progress = Math.min(Math.max(window.scrollY / totalHeight, 0), 1);
      bar.style.transform = `scaleX(${progress})`;
    }
    ticking = false;
  };

  window.addEventListener(
    "scroll",
    () => {
      if (!ticking) {
        requestAnimationFrame(updateProgress);
        ticking = true;
      }
    },
    { passive: true },
  );

  updateProgress();
}

function initialize() {
  initResponsiveContentOrder();
  initSectionNavigation();
  enhanceLinkedCards();
  bindCopyButtons();
  initReadingProgressBar();

  setTheme(savedTheme || (prefersDark ? "dark" : "light"));
  setContrast(savedContrast);
  setLanguage(savedLang, true);
}

function initSectionNavigation() {
  const links = [...document.querySelectorAll('.section-nav a[href^="#"]')];
  const targets = links
    .map((link) => document.querySelector(link.getAttribute("href")))
    .filter(Boolean);
  if (!links.length || !targets.length || !("IntersectionObserver" in window))
    return;
  const setCurrent = (id) =>
    links.forEach((link) => {
      if (link.getAttribute("href") === `#${id}`)
        link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    });
  const observer = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (visible) setCurrent(visible.target.id);
    },
    { rootMargin: "-20% 0px -65%", threshold: [0, 0.1, 0.5] },
  );
  targets.forEach((target) => observer.observe(target));
  links.forEach((link) =>
    link.addEventListener("click", () => setCurrent(link.hash.slice(1))),
  );
}

function initResponsiveContentOrder() {
  const content = document.querySelector(".content-grid");
  const sidebar = content?.querySelector(".sidebar");
  const mainColumn = content?.querySelector(".main-column");
  const sections = Object.fromEntries(
    [
      "projects",
      "employment",
      "about",
      "skills",
      "education",
      "certifications",
    ].map((id) => [id, document.getElementById(id)]),
  );
  if (
    !content ||
    !sidebar ||
    !mainColumn ||
    Object.values(sections).some((section) => !section)
  )
    return;

  const narrow = window.matchMedia("(max-width: 880px)");
  const applyOrder = () => {
    if (narrow.matches) {
      content.append(mainColumn, sidebar);
      mainColumn.append(sections.projects, sections.employment);
      sidebar.append(
        sections.about,
        sections.skills,
        sections.education,
        sections.certifications,
      );
    } else {
      content.append(sidebar, mainColumn);
      sidebar.append(sections.about, sections.certifications, sections.skills);
      mainColumn.append(
        sections.projects,
        sections.employment,
        sections.education,
      );
    }
  };

  applyOrder();
  narrow.addEventListener("change", applyOrder);
}

document.querySelectorAll(".theme-toggle").forEach((button) => {
  button.addEventListener("click", () => {
    setTheme(root.dataset.theme === "dark" ? "light" : "dark");
  });
});

document.querySelectorAll(".contrast-toggle").forEach((button) => {
  button.addEventListener("click", () => {
    setContrast(root.dataset.contrast === "high" ? "normal" : "high");
  });
});

document.querySelectorAll(".lang-toggle").forEach((button) => {
  button.addEventListener("click", () => {
    setLanguage(getCurrentLanguage() === "ar" ? "en" : "ar");
  });
});

document.querySelectorAll("[data-print-resume]").forEach((button) => {
  button.addEventListener("click", () => window.print());
});

window.addEventListener("beforeprint", updatePrintStyles);

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    const focused = document.activeElement;
    if (
      focused instanceof HTMLElement &&
      focused.hasAttribute("data-tooltip")
    ) {
      focused.blur();
    }
  }
});

initialize();

/* Reveal content once as it enters the viewport. */
function initScrollReveal() {
  const revealElements = document.querySelectorAll(
    ".panel, .li-experience-group, .featured article, .case-study-section",
  );

  if (
    !("IntersectionObserver" in window) ||
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  ) {
    revealElements.forEach((element) =>
      element.classList.add("reveal", "active"),
    );
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("active");
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.08, rootMargin: "0px 0px -32px" },
  );

  revealElements.forEach((element) => {
    element.classList.add("reveal");
    observer.observe(element);
  });
}

/* ── Interactive Image Lightbox Modal ── */
function initImageLightbox() {
  let lightbox = null;
  let lightboxImg = null;
  let lightboxCaption = null;
  let closeBtn = null;
  let lastActiveElement = null;

  function ensureLightbox() {
    if (lightbox) return;
    lightbox = document.createElement("dialog");
    lightbox.id = "image-lightbox";
    lightbox.className = "image-lightbox";
    lightbox.setAttribute(
      "aria-label",
      getTranslation(getCurrentLanguage(), "cs_image_preview"),
    );
    lightbox.innerHTML = `
      <div class="lightbox-content">
        <button class="lightbox-close-btn" type="button">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M18 6L6 18M6 6l12 12" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>
        <div class="lightbox-img-wrapper">
          <img class="lightbox-img" alt="" />
        </div>
        <p class="lightbox-caption"></p>
      </div>
    `;
    document.body.appendChild(lightbox);
    lightboxImg = lightbox.querySelector(".lightbox-img");
    lightboxCaption = lightbox.querySelector(".lightbox-caption");
    closeBtn = lightbox.querySelector(".lightbox-close-btn");
    closeBtn.setAttribute(
      "aria-label",
      getTranslation(getCurrentLanguage(), "cs_close_image_preview"),
    );

    closeBtn.addEventListener("click", closeLightbox);
    lightbox.addEventListener("click", (e) => {
      if (
        e.target === lightbox ||
        e.target.classList.contains("lightbox-img-wrapper")
      ) {
        closeLightbox();
      }
    });

    lightbox.addEventListener("cancel", (event) => {
      event.preventDefault();
      closeLightbox();
    });
    lightbox.addEventListener("keydown", (event) => {
      if (event.key === "Tab") {
        event.preventDefault();
        closeBtn.focus({ preventScroll: true });
      }
    });
    lightbox.addEventListener("close", restoreLightboxState);
  }

  function openLightbox(imgSrc, altText, captionText) {
    ensureLightbox();
    lastActiveElement = document.activeElement;
    lightboxImg.src = imgSrc;
    lightboxImg.alt = altText || "";
    lightboxCaption.textContent = captionText || altText || "";
    lightbox.setAttribute(
      "aria-label",
      getTranslation(getCurrentLanguage(), "cs_image_preview"),
    );
    closeBtn.setAttribute(
      "aria-label",
      getTranslation(getCurrentLanguage(), "cs_close_image_preview"),
    );
    lightbox.showModal();
    closeBtn.focus({ preventScroll: true });
  }

  function closeLightbox() {
    if (!lightbox?.open) return;
    lightbox.close();
  }

  function restoreLightboxState() {
    if (lightboxImg)
      lightboxImg.src =
        "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'/%3E";
    if (lastActiveElement && typeof lastActiveElement.focus === "function") {
      lastActiveElement.focus();
    }
  }

  // Attach to case study images
  const targetImages = document.querySelectorAll(
    ".case-study-image, .case-showcase-wrapper img",
  );
  targetImages.forEach((img) => {
    img.setAttribute("tabindex", "0");
    img.setAttribute("role", "button");
    img.setAttribute(
      "aria-label",
      `${getTranslation(getCurrentLanguage(), "cs_zoom_image")}: ${img.alt || getTranslation(getCurrentLanguage(), "cs_image_preview")}`,
    );

    const handleOpen = () => {
      const caption =
        img.closest("figure")?.querySelector("figcaption")?.textContent ||
        img.alt;
      openLightbox(img.src, img.alt, caption);
    };

    img.addEventListener("click", handleOpen);
    img.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handleOpen();
      }
    });
  });
}

/* ── Interactive In-Page Live Embed Viewer ── */
function initLiveEmbedViewer() {
  const toggleButtons = document.querySelectorAll("[data-toggle-embed]");
  toggleButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const container = document.getElementById("live-embed-viewer");
      if (!container) return;

      const isOpen = container.classList.toggle("is-open");
      container.hidden = !isOpen;
      btn.setAttribute("aria-expanded", String(isOpen));
      btn.querySelector("span").textContent = getTranslation(
        getCurrentLanguage(),
        isOpen ? "cs_hide_preview" : "cs_interactive_preview",
      );

      if (isOpen) {
        const iframe = container.querySelector(".live-embed-iframe");
        if (
          iframe &&
          iframe.getAttribute("src") === "about:blank" &&
          iframe.dataset.src
        ) {
          iframe.src = iframe.dataset.src;
        }
        container.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    });
  });

  const deviceButtons = document.querySelectorAll("[data-set-device]");
  deviceButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const frameContainer = document.querySelector(
        ".live-embed-frame-container",
      );
      if (!frameContainer) return;

      deviceButtons.forEach((b) => {
        b.classList.remove("is-active");
        b.setAttribute("aria-pressed", "false");
      });
      btn.classList.add("is-active");
      btn.setAttribute("aria-pressed", "true");

      const device = btn.dataset.setDevice;
      frameContainer.dataset.device = device;
    });
  });
}

initScrollReveal();
initImageLightbox();
initLiveEmbedViewer();
