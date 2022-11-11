import { useIntl } from 'umi';
import { DefaultFooter } from '@ant-design/pro-layout';
import Settings from '../../../config/defaultSettings';

const Footer = () => {
  const intl = useIntl();
  const defaultMessage = intl.formatMessage({
    id: 'app.copyright.produced',
    defaultMessage: '系统运维平台',
  });
  const currentYear = new Date().getFullYear();

  let links = [];
  if (!!Settings.footerLink?.title && !!Settings.footerLink?.link) {
    links = [{
      ...Settings.footerLink,
      href: Settings.footerLink.link,
      key: Settings.footerLink.title
    }]
  }
  return (
    <DefaultFooter
      copyright={`${currentYear} ${defaultMessage}`}
      links={links}
    />
  );
};

export default Footer;
