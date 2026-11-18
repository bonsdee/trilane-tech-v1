import Button from '../../components/Button';
import { EmptyState } from '../../components/States';

export default function AdminNotFound() {
  return (
    <EmptyState title="This dashboard page doesn't exist." action={<Button to="/admin">Back to overview</Button>} />
  );
}
