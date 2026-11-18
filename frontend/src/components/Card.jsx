import styles from './Card.module.css';

export default function Card({ as: Tag = 'div', className = '', interactive = false, children, ...rest }) {
  return (
    <Tag className={`${styles.card} ${interactive ? styles.interactive : ''} ${className}`} {...rest}>
      {children}
    </Tag>
  );
}
