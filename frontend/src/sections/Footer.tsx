const footerLinks = {
  product: {
    title: '产品',
    links: [
      { name: '功能介绍', href: '#features' },
      { name: '使用流程', href: '#how-it-works' },
      { name: '价格方案', href: '#' },
      { name: '更新日志', href: '#' },
    ],
  },
  company: {
    title: '公司',
    links: [
      { name: '关于我们', href: '#' },
      { name: '加入我们', href: '#' },
      { name: '联系方式', href: '#' },
      { name: '合作伙伴', href: '#' },
    ],
  },
  resources: {
    title: '资源',
    links: [
      { name: '帮助中心', href: '#' },
      { name: '使用指南', href: '#' },
      { name: 'API 文档', href: '#' },
      { name: '社区', href: '#' },
    ],
  },
  legal: {
    title: '法律',
    links: [
      { name: '隐私政策', href: '#' },
      { name: '服务条款', href: '#' },
      { name: 'Cookie 政策', href: '#' },
    ],
  },
};

const socialLinks = [
  { name: 'X', href: '#' },
  { name: 'GitHub', href: '#' },
  { name: 'Ins', href: '#' },
  { name: 'Email', href: '#' },
];

const Footer = () => {
  return (
    <footer className="bg-white border-t border-mono-border">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8">
          {/* Brand */}
          <div className="col-span-2">
            <a href="#hero" className="flex items-center gap-2 mb-4">
              <img
                src="/images/ccdeaabfedab259c2cdd2267ec3161e6.png"
                alt="mono"
                className="h-10 w-auto"
              />
              <span className="font-display text-xl font-bold text-mono-text">
                mono
              </span>
            </a>
            <p className="text-sm text-mono-text-secondary mb-6 max-w-xs">
              基于 AI 的智能任务管理工具，帮助你将宏大目标分解为可执行的小任务。
            </p>

            {/* Social Links */}
            <div className="flex gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  className="w-10 h-10 bg-mono-bg rounded-full flex items-center justify-center text-mono-text-secondary hover:bg-mono-primary hover:text-white transition-all duration-300 text-xs font-medium"
                >
                  {social.name}
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          {Object.values(footerLinks).map((section) => (
            <div key={section.title}>
              <h4 className="font-display font-bold text-mono-text mb-4">
                {section.title}
              </h4>
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <li key={link.name}>
                    <a
                      href={link.href}
                      className="text-sm text-mono-text-secondary hover:text-mono-primary transition-colors duration-300"
                    >
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div className="mt-16 pt-8 border-t border-mono-border flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-mono-text-muted">
            © 2024 mono. All rights reserved.
          </p>
          <p className="text-sm text-mono-text-muted flex items-center gap-1">
            Made with <span className="text-mono-primary">♥</span> by mono team
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
