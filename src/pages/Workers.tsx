import React, { useState } from 'react';
import Page from '../layouts/Page';
import Header from '../layouts/Header';
import { useMutation, useQuery } from 'react-query';
import { deleteWorker, fetchWorkers } from '../api-client';
import { useAppContext } from '../context/AppProvider';
import RecordCard from '../components/RecordCard';
import { Col, Row } from 'react-bootstrap';
import InfiniteScroll from 'react-infinite-scroll-component';
import Scroll from '../layouts/Scroll';
import Loading from '../layouts/Loading';
import { Worker } from '../misc/types';
import { useTranslation } from 'react-i18next';
import { handleWorkerDelete } from '../misc/helpers';
import WorkerModal from '../components/Modals/Worker';

const Workers = (): React.JSX.Element => {
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [workers, setWorkers] = useState<Worker[]>([])
  const [selectedWorkers, setSelectedWorkers] = useState<Worker | undefined>(undefined)

  const { t: translating } = useTranslation("global")
  const { showToast, setLayout, showWarning } = useAppContext();
  const { isLoading } = useQuery(["workers", page], () => fetchWorkers(page), {
    onSuccess: (fetchedData) => {
      const newData = fetchedData.workers;

      if (newData.length > 0) {
        setWorkers((prevWorkers) => [...prevWorkers, ...newData]);
        setPage((prevPage) => prevPage + 1);

        if (newData.length < 10) {
          setHasMore(false);
        }
      } else {
        setHasMore(false);
      }
    },
    onError: () => {
      showToast({ message: "Something went wrong", type: "ERROR" });
    },
    retry: false,
    refetchOnWindowFocus: false,
    enabled: page === 1 || workers.length === 0
  });

  const mutationDelete = useMutation(deleteWorker, {
    onMutate: () => {
      setLayout(true)
    },
    onSuccess: (data) => {
      showToast({ message: translating("workers.delete.success"), type: "SUCCESS" })
      handleWorkerDelete(data.id, workers, setWorkers)
    },
    onError: () => {
      showToast({ message: translating("workers.delete.error"), type: "ERROR" })
    },
    onSettled: () => {
      setLayout(false)
    }
  })

  const handleDelete = (id: number, name: string) => {
    showWarning({
      message: `${translating("global.confirmDelete")} ${name}?`,
      btn1: translating("global.cancel"),
      btn2: translating("global.delete"),
      handleBtn2: () => mutationDelete.mutate(id)
    })
  }

  const fetchMoreData = () => {
    if (hasMore && !isLoading) {
      setPage(prevPage => prevPage + 1);
    }
  };

  if (isLoading && workers.length === 0 && hasMore)
    return <div className='flex-1 flex-center'>
      <Loading />
    </div>

  return (
    <Page id='workers' className='d-flex flex-column align-items-start overflow-hidden'>
      <Header name={translating("workers.title")} />

      <button
        onClick={() => setSelectedWorkers({
          id: -1,
          fullName: "",
          personal_id: "",
          phone: "",
          work_type: "",
          password: ""
        })}
        className='m-2 border-0 fw-semibold bg-main text-main rounded-1 px-3 py-1'>
        {translating("workers.add")}
      </button>

      {!isLoading && workers.length === 0
        ? <h1 className='text-center text-secondary mt-2 w-100'>{translating("workers.empty")}</h1>
        : <Scroll>
          <InfiniteScroll
            dataLength={workers.length}
            className='overflow-hidden px-1'
            next={fetchMoreData}
            hasMore={hasMore}
            loader={<></>}
            scrollThreshold={0.9}
          >
            <Row className='align-items-start justify-content-start g-2 py-2'>
              {workers.map(worker => (
                <Col key={`worker-${worker.id}`} xs={12} sm={6}>
                  <RecordCard
                    handleDelete={handleDelete}
                    withWhatsApp
                    id={worker.id}
                    name={worker.fullName}
                    phone={worker.phone}
                    handleSelectRecord={() => {
                      setSelectedWorkers({
                        id: worker.id,
                        fullName: worker.fullName,
                        personal_id: worker.personal_id,
                        phone: worker.phone,
                        password: ""
                      })
                    }}
                  />
                </Col>
              ))}
            </Row>
          </InfiniteScroll>
        </Scroll >}

      {selectedWorkers && <WorkerModal
        worker={selectedWorkers}
        onClose={() => setSelectedWorkers(undefined)}
        setWorkers={setWorkers}
      />}
    </Page >
  );
};

export default Workers;
