import { Button, Result } from "antd";
import Link from "next/link";

const NotFound = () => {
  return (
    <main className="flex min-h-screen min-w-full items-center justify-center">
      <Result
        status="404"
        title="404"
        subTitle="Sorry, the page you visited does not exist."
        extra={
          <Button type="primary" size="large">
            <Link href="/">Back Home</Link>
          </Button>
        }
      />
    </main>
  );
};

export default NotFound;
